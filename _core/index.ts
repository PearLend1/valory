import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./static";
import { initDemoMode } from "../demo-mode";
import { externalDataRegistry } from "../external-data-provider";
import { ProductionStreetDataProvider } from "../street-data-provider";

const API_RATE_WINDOW_MS = 60_000;
const API_RATE_LIMIT = 60;
const VALUATION_RATE_WINDOW_MS = 15 * 60_000;
const VALUATION_RATE_LIMIT = 10;

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();
const valuationRateBuckets = new Map<string, RateBucket>();

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting at ${startPort}`);
}

function requestIsSecure(req: Request): boolean {
  if (req.secure || req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const values = Array.isArray(forwardedProto)
    ? forwardedProto
    : String(forwardedProto ?? "").split(",");
  return values.some(value => value.trim().toLowerCase() === "https");
}

function setSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "upgrade-insecure-requests",
      ].join("; ")
    );

    if (requestIsSecure(req)) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
    }
  }

  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }

  next();
}

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function updateRateBucket(
  buckets: Map<string, RateBucket>,
  key: string,
  windowMs: number,
  now: number
): RateBucket {
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket;
}

function pruneExpiredBuckets(buckets: Map<string, RateBucket>, now: number) {
  if (buckets.size <= 10_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function rateLimitValuations(req: Request, res: Response, next: NextFunction) {
  // tRPC places the procedure in the URL, including batched requests.
  if (!req.originalUrl.toLowerCase().includes("valuation.")) {
    next();
    return;
  }

  const now = Date.now();
  const bucket = updateRateBucket(
    valuationRateBuckets,
    clientKey(req),
    VALUATION_RATE_WINDOW_MS,
    now
  );
  const remaining = Math.max(0, VALUATION_RATE_LIMIT - bucket.count);

  res.setHeader("Valuation-RateLimit-Limit", String(VALUATION_RATE_LIMIT));
  res.setHeader("Valuation-RateLimit-Remaining", String(remaining));
  res.setHeader(
    "Valuation-RateLimit-Reset",
    String(Math.ceil(bucket.resetAt / 1000))
  );

  if (bucket.count > VALUATION_RATE_LIMIT) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    res.status(429).json({
      error: "Too many valuation requests. Please try again later.",
    });
    return;
  }

  pruneExpiredBuckets(valuationRateBuckets, now);
  next();
}

function rateLimitApi(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const bucket = updateRateBucket(
    rateBuckets,
    clientKey(req),
    API_RATE_WINDOW_MS,
    now
  );
  const remaining = Math.max(0, API_RATE_LIMIT - bucket.count);
  res.setHeader("RateLimit-Limit", String(API_RATE_LIMIT));
  res.setHeader("RateLimit-Remaining", String(remaining));
  res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > API_RATE_LIMIT) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    res.status(429).json({ error: "Too many requests. Please try again shortly." });
    return;
  }

  pruneExpiredBuckets(rateBuckets, now);
  next();
}

async function startServer() {
  initDemoMode();

  const streetDataKey = process.env.STREET_DATA_API_KEY;
  if (streetDataKey) {
    externalDataRegistry.register(
      new ProductionStreetDataProvider(streetDataKey)
    );
    console.log("[Valory] Street Data API provider registered");
  } else {
    console.warn(
      "[Valory] STREET_DATA_API_KEY is not set; live valuations will be unavailable"
    );
  }

  const app = express();
  const server = createServer(app);

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(setSecurityHeaders);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  let cachedHealth:
    | { expiresAt: number; providers: Awaited<ReturnType<typeof externalDataRegistry.getAllHealth>> }
    | undefined;

  app.get("/api/health", async (_req, res) => {
    try {
      const now = Date.now();
      if (!cachedHealth || cachedHealth.expiresAt <= now) {
        cachedHealth = {
          expiresAt: now + 60_000,
          providers: await externalDataRegistry.getAllHealth(),
        };
      }

      const street = cachedHealth.providers.find(
        provider => provider.name === "Street Data API"
      );
      const configured = Boolean(streetDataKey);
      const available = Boolean(street?.available);
      const status = configured && available ? "ok" : "degraded";

      res.status(status === "ok" ? 200 : 503).json({
        status,
        streetData: { configured, available },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Health] Provider health check failed", error);
      res.status(503).json({
        status: "degraded",
        streetData: { configured: Boolean(streetDataKey), available: false },
        timestamp: new Date().toISOString(),
      });
    }
  });

  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    rateLimitValuations,
    rateLimitApi,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    // Keep Vite and its native development dependencies out of the production
    // server bundle. The non-literal import is resolved by tsx in development.
    const viteModulePath = "./vite";
    const { setupVite } = await import(viteModulePath);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(error => {
  console.error("[Valory] Server failed to start", error);
  process.exitCode = 1;
});
