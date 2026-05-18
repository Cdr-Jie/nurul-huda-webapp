// api/index.ts
import express from "express";
import cors from "cors";
import { auth } from "../src/lib/auth.js";
import { toNodeHandler } from "better-auth/node";
import { createClient } from "@supabase/supabase-js";

const app = express();

// 1. CORS Middleware
app.use(cors({
  origin: ["https://nurul-huda-webapp-one.vercel.app", "http://localhost:5174", "http://localhost:5173"],
  credentials: true,
}));

// 2. CRITICAL: Better Auth must come BEFORE express.json()
app.all("/api/auth/*", (req, res, next) => {
  toNodeHandler(auth)(req, res, next);
});

// 3. NOW you can safely add the JSON body parser for your other routes
app.use(express.json());

// 4. Supabase Events Endpoint
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
);

app.get("/api/events", async (req, res) => {
  try {
    const { data, error } = await supabase.from("events").select("*").order("date", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// 5. CRITICAL FOR VERCEL: Disable Vercel's native body parser so Better Auth can read the raw stream
export const config = {
  api: {
    bodyParser: false,
  },
};

// Export the Express app for Vercel
export default app;