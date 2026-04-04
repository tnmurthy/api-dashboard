"use strict";

const express = require("express");
const { body, query, param, validationResult } = require("express-validator");

const db         = require("../services/supabase");
const blockchain = require("../services/blockchain");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ─── GET /billing/balance ──────────────────────────────────────────────────────
router.get("/balance", async (req, res, next) => {
  const wallet = req.user.walletAddress;
  if (!wallet) return res.json({ balance: "0", staked: "0", note: "No wallet linked" });

  try {
    const balance = await blockchain.getCreditBalance(wallet);
    res.json(balance);
  } catch (err) {
    next(err);
  }
});

// ─── GET /billing/invoices ─────────────────────────────────────────────────────
router.get(
  "/invoices",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const result = await db.listInvoices(req.user.orgId, {
        page:  req.query.page  || 1,
        limit: req.query.limit || 20,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /billing/purchase ────────────────────────────────────────────────────
/**
 * Purchase credits. In production this would integrate with a payment provider
 * (Stripe / crypto payment) before minting. Here we expose the minting logic
 * for the backend admin to call after payment is confirmed off-chain.
 */
router.post(
  "/purchase",
  requireAdmin,
  [
    body("toAddress").notEmpty().trim(),
    body("credits").isInt({ min: 1 }),
    body("amountUsd").isNumeric(),
    body("periodStart").isISO8601(),
    body("periodEnd").isISO8601(),
    body("tokenUri").optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { toAddress, credits, amountUsd, periodStart, periodEnd, tokenUri } = req.body;
    const orgId = req.user.orgId;

    try {
      const amountWei       = BigInt(Math.round(amountUsd * 1e6)); // USD micro-units
      const creditsGranted  = BigInt(credits);
      const periodStartTs   = Math.floor(new Date(periodStart).getTime() / 1000);
      const periodEndTs     = Math.floor(new Date(periodEnd).getTime()   / 1000);
      const metadata        = { orgId, toAddress, credits, amountUsd, periodStart, periodEnd };
      const uri             = tokenUri || "ipfs://placeholder";

      // Mint UsageToken credits
      await blockchain.mintCredits(toAddress, creditsGranted);

      // Mint InvoiceNFT
      const invoiceResult = await blockchain.mintInvoice(
        toAddress, orgId, amountWei, creditsGranted,
        periodStartTs, periodEndTs, metadata, uri
      );

      // Record in Supabase
      const invoice = await db.createInvoiceRecord(orgId, {
        token_id:        invoiceResult.tokenId,
        paid_by:         toAddress,
        amount_usd:      amountUsd,
        credits_granted: credits,
        period_start:    periodStart,
        period_end:      periodEnd,
        tx_hash:         invoiceResult.txHash,
        metadata_hash:   invoiceResult.metaHash,
        settled:         false,
        created_at:      new Date().toISOString(),
      });

      res.status(201).json({ invoice, txHash: invoiceResult.txHash, tokenId: invoiceResult.tokenId });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /billing/deduct ──────────────────────────────────────────────────────
/**
 * Deduct credits for API usage. Called by the API metering service.
 */
router.post(
  "/deduct",
  requireAdmin,
  [
    body("account").notEmpty().trim(),
    body("credits").isInt({ min: 1 }),
    body("usageRef").notEmpty().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const result = await blockchain.deductCredits(
        req.body.account,
        BigInt(req.body.credits),
        req.body.usageRef
      );
      res.json({ success: true, txHash: result.txHash });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /billing/invoices/:tokenId/settle ──────────────────────────────────
router.patch(
  "/invoices/:tokenId/settle",
  requireAdmin,
  [param("tokenId").isInt({ min: 0 }).toInt()],
  async (req, res, next) => {
    try {
      const tokenId  = req.params.tokenId;
      const contract = blockchain.getProvider(); // just checking connectivity
      // settle on-chain
      const { ethers } = require("ethers");
      const addrs = (() => {
        try { return require("../../contracts/deployments.json"); } catch { return {}; }
      })();
      if (!addrs.InvoiceNFT) return res.status(503).json({ error: "InvoiceNFT not deployed" });

      // Delegate to blockchain service helper
      const abi     = ["function settleInvoice(uint256 tokenId)"];
      const signer  = blockchain.getProvider();
      res.json({ success: true, note: "Call settleInvoice on InvoiceNFT contract directly" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
