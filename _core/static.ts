import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}; build the client before starting the server`
    );
  }

  app.use(
    express.static(distPath, {
      etag: true,
      fallthrough: true,
      index: false,
      maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
      setHeaders(res, filePath) {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  // Path-to-regexp handling changed in Express 5. A pathless final middleware
  // is the portable SPA fallback and still lets the earlier API routes win.
  app.use((_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
