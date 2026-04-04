"use strict";

const jwt = require("jsonwebtoken");

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable must be set in production");
  }
  console.warn("WARNING: JWT_SECRET is not set. Using insecure default – do NOT use in production.");
}

const _JWT_SECRET = JWT_SECRET || "dev_secret_change_me";

/**
 * Sign a JWT for the given user payload.
 * @param {object} payload  { userId, orgId, role, walletAddress }
 * @returns {string}
 */
function signToken(payload) {
  return jwt.sign(payload, _JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * Express middleware – validates the Bearer JWT in the Authorization header.
 * Attaches the decoded payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, _JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
}

/**
 * Express middleware – restricts access to users with role 1 (Admin).
 * Must be used AFTER authenticate.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 1) {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
}

/**
 * Express middleware – restricts access to Admin (1) or Sales Rep (2).
 * Must be used AFTER authenticate.
 */
function requireSalesOrAdmin(req, res, next) {
  const role = req.user?.role;
  if (role !== 1 && role !== 2) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
}

module.exports = { signToken, authenticate, requireAdmin, requireSalesOrAdmin };
