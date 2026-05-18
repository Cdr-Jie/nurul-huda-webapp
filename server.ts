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

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
  );

  // CORS middleware
  app.use(cors({
    origin: ["https://nurul-huda-webapp-one.vercel.app", "http://localhost:5174", "http://localhost:5173"],
    credentials: true,
  }));

  
  // AUTH ROUTES (BEFORE body parser)
  app.all("/api/auth/*", (req, res, next) => {
    console.log(`[AUTH] ${req.method} ${req.path}`);
    toNodeHandler(auth)(req, res, next);
  });
  
  app.use(express.json());

  // Error handling middleware for auth
  app.use((err, req, res, next) => {
    if (req.path.startsWith("/api/auth")) {
      console.error("[AUTH ERROR]", err);
    }
    next(err);
  });

  // EVENTS ENDPOINT
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
  });
})();
