import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  const indexPath = path.resolve(distPath, "index.html");

  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `Could not find the built client entry point: ${indexPath}; build the client before starting the server`
    );
  }

  // Cache the SPA shell once at startup. This avoids a filesystem read for every
  // client-side route and removes an unnecessary denial-of-service opportunity.
  const indexHtml = fs.readFileSync(indexPath, "utf8");

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
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    // Unknown API requests must not receive the client application shell.
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.setHeader("Cache-Control", "no-cache");
    res.type("html").send(indexHtml);
  });
}
