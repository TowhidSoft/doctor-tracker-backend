import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import helmet from "helmet";

import routes from "./app/routes/index";
import GlobalErrorHandler from "./app/middleware/globalErrorHandler";
import { PORT, frontend_url } from "./config/config";
import { initiateSuperAdmin } from "./initialization/initiateSuperAdmin";

const app = express();

// Behind Render / Vercel / nginx the client IP arrives in X-Forwarded-For (needed by the rate limiter).
app.set("trust proxy", 1);

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", frontend_url], // FRONTEND_URL = your deployed client
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.use(hpp());
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(cookieParser());

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 6000 }));
app.set("etag", false);

// Create the first admin account if it does not exist yet.
initiateSuperAdmin().catch((error) => console.error("Could not create the admin user:", error));

app.get("/", (_req: Request, res: Response) => res.send("Doctor Tracker API working"));
app.get("/health", (_req: Request, res: Response) => res.status(200).json({ status: "ok" }));

app.use("/api/v1", routes);
app.use(GlobalErrorHandler);

app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({ status: false, message: "Incorrect API" });
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

export default app;
