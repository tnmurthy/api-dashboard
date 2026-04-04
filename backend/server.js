"use strict";

require("dotenv").config();
const express     = require("express");
const helmet      = require("helmet");
const cors        = require("cors");
const morgan      = require("morgan");
const rateLimit   = require("express-rate-limit");

const authRoutes      = require("./routes/auth");
const contactsRoutes  = require("./routes/contacts");
const dealsRoutes     = require("./routes/deals");
const activitiesRoutes = require("./routes/activities");
const billingRoutes   = require("./routes/billing");

const { authenticate } = require("./middleware/auth");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Security middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  credentials: true,
}));

// ─── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  max:      parseInt(process.env.RATE_LIMIT_MAX       || "100"),
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use(limiter);

// ─── Health check (unauthenticated) ──────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version || "1.0.0",
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth",       authRoutes);
app.use("/api/v1/contacts",   authenticate, contactsRoutes);
app.use("/api/v1/deals",      authenticate, dealsRoutes);
app.use("/api/v1/activities", authenticate, activitiesRoutes);
app.use("/api/v1/billing",    authenticate, billingRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CRM backend running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
