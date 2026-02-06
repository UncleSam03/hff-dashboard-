import express from "express";
import path from "node:path";

import { parseHffRegisterRows } from "../src/lib/hffRegister.js";
import { getEnv } from "./env.js";
import { clearRegister, readRegisterValues, writeRegister } from "./googleSheets.js";

const app = express();

app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/stats", async (_req, res) => {
  try {
    const values = await readRegisterValues();
    const parsed = parseHffRegisterRows(values);
    res.json({ ...parsed, source: "google_sheets" });
  } catch (err) {
    res.status(500).json({
      error: "Failed to load stats from Google Sheets",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

app.put("/api/register", async (req, res) => {
  try {
    const { rows } = req.body || {};
    if (!Array.isArray(rows) || !rows.every((r) => Array.isArray(r))) {
      return res.status(400).json({ error: "Body must be { rows: any[][] }" });
    }

    // Clear then write so old data doesn't linger
    await clearRegister();
    await writeRegister(rows);

    // Return computed analytics so the UI can refresh immediately
    const parsed = parseHffRegisterRows(rows);
    res.json({ ok: true, ...parsed });
  } catch (err) {
    res.status(500).json({
      error: "Failed to write register to Google Sheets",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Basic static hosting option for production build (optional)
const serveDist = getEnv("HFF_SERVE_DIST", { defaultValue: "false" }) === "true";
if (serveDist) {
  const distDir = path.resolve(process.cwd(), "dist");
  app.use(express.static(distDir));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

const port = Number(getEnv("HFF_API_PORT", { defaultValue: "8787" }));
app.listen(port, () => {
  // Avoid printing secrets; just a helpful startup message
  console.log(`[hff-dashboard] API listening on http://localhost:${port}`);
});

