"use strict";

const express = require("express");
const { body, query, param, validationResult } = require("express-validator");

const db         = require("../services/supabase");
const blockchain = require("../services/blockchain");
const { requireSalesOrAdmin, requireAdmin } = require("../middleware/auth");

const STAGE_MAP = {
  lead:        0,
  qualified:   1,
  proposal:    2,
  negotiation: 3,
  closedwon:   4,
  closedlost:  5,
};

const router = express.Router();

// ─── GET /deals ───────────────────────────────────────────────────────────────
router.get(
  "/",
  [
    query("stage").optional().isIn(Object.keys(STAGE_MAP)),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const result = await db.listDeals(req.user.orgId, {
        stage:      req.query.stage,
        assignedTo: req.query.assignedTo,
        page:       req.query.page  || 1,
        limit:      req.query.limit || 20,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /deals ──────────────────────────────────────────────────────────────
router.post(
  "/",
  requireSalesOrAdmin,
  [
    body("title").notEmpty().trim(),
    body("contactId").optional().notEmpty(),
    body("value").optional().isNumeric(),
    body("assignedTo").optional().trim(),
    body("notes").optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, contactId, value, assignedTo, notes } = req.body;
    const orgId = req.user.orgId;

    try {
      const deal = await db.createDeal(orgId, {
        title,
        contact_id:  contactId  || null,
        value:       value      || 0,
        assigned_to: assignedTo || req.user.walletAddress || null,
        notes:       notes      || "",
        stage:       "lead",
        active:      true,
        created_by:  req.user.userId,
        created_at:  new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      });

      // Register deal on-chain
      let onChainResult = null;
      try {
        const hashPayload  = { title, value: value || 0, contactId: contactId || null };
        const contactOnChainId = contactId || "0x" + "0".repeat(64);
        const assignee         = assignedTo || req.user.walletAddress || "0x" + "0".repeat(40);
        const valueWei         = BigInt(Math.round((value || 0) * 1e6)); // scale USD to micro-units

        onChainResult = await blockchain.createDeal(
          orgId, contactOnChainId, hashPayload, assignee, valueWei
        );
        await db.updateDeal(orgId, deal.id, {
          on_chain_id:   onChainResult.dealId,
          data_hash:     onChainResult.dataHash,
          chain_tx_hash: onChainResult.txHash,
        });
      } catch (bcErr) {
        console.warn("DealPipeline on-chain creation failed (non-fatal):", bcErr.message);
      }

      res.status(201).json({
        ...deal,
        onChainId: onChainResult?.dealId,
        txHash:    onChainResult?.txHash,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /deals/:id ───────────────────────────────────────────────────────────
router.get(
  "/:id",
  [param("id").notEmpty()],
  async (req, res, next) => {
    try {
      const deal = await db.getDeal(req.user.orgId, req.params.id);
      if (!deal) return res.status(404).json({ error: "Deal not found" });
      res.json(deal);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /deals/:id/stage ───────────────────────────────────────────────────
router.patch(
  "/:id/stage",
  requireSalesOrAdmin,
  [
    param("id").notEmpty(),
    body("stage").isIn(Object.keys(STAGE_MAP)),
    body("notes").optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const orgId  = req.user.orgId;
    const dealId = req.params.id;
    const { stage, notes } = req.body;

    try {
      const existing = await db.getDeal(orgId, dealId);
      if (!existing) return res.status(404).json({ error: "Deal not found" });

      const stageNum = STAGE_MAP[stage];
      const updated  = await db.updateDeal(orgId, dealId, {
        stage,
        active: stageNum < 4,
      });

      // Advance stage on-chain
      if (existing.on_chain_id) {
        try {
          const notesPayload = notes ? { notes, actor: req.user.userId, timestamp: new Date().toISOString() } : null;
          await blockchain.advanceDealStage(existing.on_chain_id, stageNum, notesPayload);
        } catch (bcErr) {
          console.warn("DealPipeline on-chain advance failed (non-fatal):", bcErr.message);
        }
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /deals/:id ─────────────────────────────────────────────────────────
router.patch(
  "/:id",
  requireSalesOrAdmin,
  [
    param("id").notEmpty(),
    body("title").optional().trim(),
    body("value").optional().isNumeric(),
    body("notes").optional().trim(),
    body("assignedTo").optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const updates = {};
      ["title", "value", "notes"].forEach(f => {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      });
      if (req.body.assignedTo !== undefined) updates.assigned_to = req.body.assignedTo;

      const updated = await db.updateDeal(req.user.orgId, req.params.id, updates);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
