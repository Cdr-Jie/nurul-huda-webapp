import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configure dotenv to load from .env.local FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

// Start async initialization
(async () => {
  // NOW import modules that depend on env vars
  const express = (await import("express")).default;
  const { auth } = await import("./src/lib/auth.js");
  const { toNodeHandler } = await import("better-auth/node");
  const cors = (await import("cors")).default;
  const { createClient } = await import("@supabase/supabase-js");
  const multer = (await import("multer")).default; // ADDED: Multer for file uploads

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Initialize standard Supabase client (for public/anon tasks like fetching events)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
  );

  // Initialize Supabase Admin client (CRITICAL: Uses Service Role Key to bypass RLS for secure uploads)
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  // Configure Multer to hold files in memory with a 2MB limit
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  });

  // CORS middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow localhost on any port for development
      if (!origin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:") || origin === "https://nurul-huda-webapp-one.vercel.app") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }));

  // AUTH ROUTES (BEFORE body parser)
  app.all("/api/auth/*", (req, res, next) => {
    console.log(`[AUTH] ${req.method} ${req.path}`);
    toNodeHandler(auth)(req, res, next);
  });
  
  app.use(express.json());

  // Error handling middleware for auth
  app.use((err: any, req: any, res: any, next: any) => {
    if (req.path.startsWith("/api/auth")) {
      console.error("[AUTH ERROR]", err);
    }
    next(err);
  });

  // ============================================
  // SECURE FILE UPLOAD ENDPOINT
  // ============================================
  app.post("/api/upload-profile-image", upload.single("image"), async (req, res) => {
    try {
      // 1. Verify the user is actually logged in using better-auth
      const session = await auth.api.getSession({ headers: req.headers });
      
      if (!session || !session.user) {
        return res.status(401).json({ error: "Sila log masuk untuk memuat naik gambar." });
      }

      // 2. Ensure a file was actually sent
      if (!req.file) {
        return res.status(400).json({ error: "Tiada fail dijumpai." });
      }

      // 3. CLEANUP: Delete the old profile picture if it exists in Supabase
      const oldImageUrl = session.user.image;
      
      if (oldImageUrl && oldImageUrl.includes("supabase.co/storage/v1/object/public/user_images/")) {
        // Splits the URL and grabs everything after "user_images/"
        const urlParts = oldImageUrl.split("user_images/");
        
        if (urlParts.length === 2) {
          // This will equal "USER_ID/1779346313658.jpg"
          const oldFilePath = urlParts[1]; 
          
          const { error: deleteError } = await supabaseAdmin.storage
            .from("user_images")
            .remove([oldFilePath]);

          if (deleteError) {
            console.error("[UPLOAD] Failed to delete old image:", deleteError);
          } else {
            console.log(`[UPLOAD] Successfully deleted old image: ${oldFilePath}`);
          }
        }
      }

      // 4. Create a safe file path for the NEW image
      let fileExt = req.file.originalname.split(".").pop();
      if (fileExt === "blob" || !fileExt) {
        fileExt = req.file.mimetype === "image/png" ? "png" : "jpg";
      }
      
      // RESTORED BEST PRACTICE: Put the file inside a folder named after the User's ID!
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

      // 5. Upload new image to Supabase bypassing RLS using the Admin Client
      const { error: uploadError } = await supabaseAdmin.storage
        .from("user_images")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("[UPLOAD] Supabase Admin error:", uploadError);
        return res.status(500).json({ error: "Gagal menyimpan di pelayan (Storage Error)." });
      }

      // 6. Generate and return the public URL to the frontend
      const { data: publicUrlData } = supabaseAdmin.storage
        .from("user_images")
        .getPublicUrl(filePath);

      res.json({ publicUrl: publicUrlData.publicUrl });
    } catch (err) {
      console.error("[UPLOAD] Server error:", err);
      res.status(500).json({ error: "Ralat pelayan dalaman." });
    }
  });

  // ============================================
  // EVENTS ENDPOINT
  // ============================================
  app.get("/api/events", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json(data ?? []);
    } catch (err) {
      console.error("Error fetching events:", err);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.listen(PORT, () => {
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
    console.log(`[SERVER] Auth endpoint: http://localhost:${PORT}/api/auth`);
    console.log(`[SERVER] Events endpoint: http://localhost:${PORT}/api/events`);
    console.log(`[SERVER] Upload endpoint: http://localhost:${PORT}/api/upload-profile-image`);
  });
})();