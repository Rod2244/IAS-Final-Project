// server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const mfaRoutes = require("./routes/mfaRoutes");
const studentRoutes = require("./routes/studentRoutes");
const gradeRoutes = require("./routes/gradeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const subjectRoutes = require("./routes/subjectRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Configure trust proxy more securely - only trust single proxy in dev/staging
// In production, set to a specific number or function based on your infra
const trustProxyValue = process.env.TRUST_PROXY_HOPS || 1;
app.set("trust proxy", trustProxyValue);

// Security middleware
app.use(helmet());
app.use(cookieParser(process.env.COOKIE_SECRET || "change-this-secret"));

// Content Security Policy (CSP) header to mitigate XSS
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';"
  );
  next();
});

// Inside Backend/server.js
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Lax for local development, Strict for production
    path: "/",
  },
});

// CORS middleware with explicit HTTP method allowances
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());

// Rate limiting for auth endpoints with safe trust proxy settings
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication requests. Please try again later." },
  // Do not trust proxy for rate limiting; key by connection IP only
  skip: (req) => process.env.SKIP_RATE_LIMIT === "true",
  keyGenerator: (req) => req.socket.remoteAddress,
});
app.use("/api/auth", authLimiter);

// Apply CSRF protection globally - GET requests skip validation automatically
app.use(csrfProtection); 

// Endpoint to get CSRF token - req.csrfToken() available after middleware
app.get("/api/auth/csrf-token", (req, res) => {
  const token = req.csrfToken();
  res.cookie("XSRF-TOKEN", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.status(200).json({ csrfToken: token });
});

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const forwardedProto = req.headers["x-forwarded-proto"] || "";
    if (!req.secure && forwardedProto.toLowerCase() !== "https" && !req.hostname.includes("localhost")) {
      return res.status(426).json({ error: "Please use HTTPS for all requests." });
    }
    next();
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running smoothly", timestamp: new Date() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/mfa", mfaRoutes);
app.use("/api/auth/password-reset", passwordResetRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/subjects", subjectRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

// Start Server
const server = app.listen(PORT);

server.on("listening", () => {
  console.log(`✅ Server is running smoothly on port ${PORT}`);
  console.log(
    `📡 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`,
  );
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Stop the other process or set PORT in .env.`,
    );
  } else {
    console.error("❌ Server failed to start:", err.message);
  }
  process.exit(1);
});
