"use strict";

const express  = require("express");
const bcrypt   = require("bcryptjs");
const { ethers } = require("ethers");
const { body, validationResult } = require("express-validator");

const db          = require("../services/supabase");
const blockchain  = require("../services/blockchain");
const { signToken, authenticate } = require("../middleware/auth");

const router = express.Router();

// ─── Email + Password Sign-up ────────────────────────────────────────────────
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("orgName").notEmpty().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, orgName } = req.body;
    try {
      const existing = await db.getUserByEmail(email);
      if (existing) return res.status(409).json({ error: "Email already registered" });

      const passwordHash = await bcrypt.hash(password, 12);

      // Create off-chain user record
      const user = await db.createUser({
        email,
        password_hash: passwordHash,
        role:          1, // owner = admin
        created_at:    new Date().toISOString(),
      });

      // Register org on-chain (backend signer acts as org owner until wallet linked)
      let onChainOrgId = null;
      try {
        const result  = await blockchain.registerOrg(orgName);
        onChainOrgId  = result.orgId;
      } catch (bcErr) {
        console.warn("Blockchain org registration failed (non-fatal):", bcErr.message);
      }

      await db.updateUser(user.id, { on_chain_org_id: onChainOrgId });

      const token = signToken({
        userId:  user.id,
        orgId:   user.org_id || onChainOrgId,
        role:    user.role,
      });

      res.status(201).json({ token, userId: user.id, orgId: onChainOrgId });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Email + Password Login ──────────────────────────────────────────────────
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await db.getUserByEmail(email);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      const token = signToken({
        userId:        user.id,
        orgId:         user.on_chain_org_id,
        role:          user.role,
        walletAddress: user.wallet_address,
      });

      res.json({ token, userId: user.id, orgId: user.on_chain_org_id, role: user.role });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Sign-in with Ethereum (SIWE) ────────────────────────────────────────────
/**
 * Step 1: request a nonce for a wallet address
 */
router.get("/siwe/nonce/:walletAddress", async (req, res, next) => {
  try {
    const wallet = req.params.walletAddress.toLowerCase();
    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // Store or update nonce in DB (expires in 5 minutes)
    const nonce = ethers.hexlify(ethers.randomBytes(16));
    const user  = await db.getUserByWallet(wallet);

    if (user) {
      await db.updateUser(user.id, { siwe_nonce: nonce, siwe_nonce_expires: new Date(Date.now() + 300_000).toISOString() });
    } else {
      await db.createUser({
        wallet_address:       wallet,
        siwe_nonce:           nonce,
        siwe_nonce_expires:   new Date(Date.now() + 300_000).toISOString(),
        role:                 1,
        created_at:           new Date().toISOString(),
      });
    }

    res.json({ nonce });
  } catch (err) {
    next(err);
  }
});

/**
 * Step 2: verify signed message and return JWT
 * Body: { walletAddress, message, signature }
 *
 * The client should sign a message like:
 *   "Sign in to CRM Command Center\nNonce: {nonce}\nTimestamp: {iso}"
 */
router.post(
  "/siwe/verify",
  [
    body("walletAddress").notEmpty(),
    body("message").notEmpty(),
    body("signature").notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { walletAddress, message, signature } = req.body;

    try {
      // Recover signer from signature
      const recovered = ethers.verifyMessage(message, signature);
      if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ error: "Signature verification failed" });
      }

      const user = await db.getUserByWallet(walletAddress.toLowerCase());
      if (!user) return res.status(401).json({ error: "Wallet not registered" });

      // Check nonce is present in message and not expired
      if (!message.includes(user.siwe_nonce)) {
        return res.status(401).json({ error: "Invalid nonce" });
      }
      if (new Date(user.siwe_nonce_expires) < new Date()) {
        return res.status(401).json({ error: "Nonce expired" });
      }

      // Invalidate nonce
      await db.updateUser(user.id, { siwe_nonce: null, siwe_nonce_expires: null });

      const token = signToken({
        userId:        user.id,
        orgId:         user.on_chain_org_id,
        role:          user.role,
        walletAddress: walletAddress.toLowerCase(),
      });

      res.json({ token, userId: user.id, orgId: user.on_chain_org_id, role: user.role });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Get current user ─────────────────────────────────────────────────────────
router.get("/me", authenticate, async (req, res, next) => {
  try {
    let user = await db.getUserByEmail(req.user.userId); // userId might be UUID
    if (!user) {
      // fallback: wallet users
      user = await db.getUserByWallet(req.user.walletAddress || "");
    }
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password_hash, siwe_nonce, siwe_nonce_expires, ...safe } = user;
    res.json(safe);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
