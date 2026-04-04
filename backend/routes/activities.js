"use strict";

const express = require("express");
const { body, query, param, validationResult } = require("express-validator");

const db         = require("../services/supabase");
const blockchain = require("../services/blockchain");

const ACTIVITY_TYPES = {
  call:        0,
  email:       1,
  meeting:     2,
  note:        3,
  apiUsage:    4,
  dealUpdate:  5,
  custom:      6,
};

const router = express.Router();

// ─── GET /activities ─────────────────────────────────────────────────────────
router.get(
  "/",
  [
    query("contactId").optional().notEmpty(),
    query("dealId").optional().notEmpty(),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const result = await db.listActivities(req.user.orgId, {
        contactId: req.query.contactId,
        dealId:    req.query.dealId,
        page:      req.query.page  || 1,
        limit:     req.query.limit || 50,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /activities ─────────────────────────────────────────────────────────
router.post(
  "/",
  [
    body("type").isIn(Object.keys(ACTIVITY_TYPES)),
    body("summary").notEmpty().trim(),
    body("contactId").optional().notEmpty(),
    body("dealId").optional().notEmpty(),
    body("metadata").optional().isObject(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { type, summary, contactId, dealId, metadata } = req.body;
    const orgId = req.user.orgId;

    try {
      // 1. Write to Supabase
      const activity = await db.createActivity(orgId, {
        type,
        summary,
        contact_id: contactId || null,
        deal_id:    dealId    || null,
        metadata:   metadata  || {},
        actor:      req.user.userId,
        created_at: new Date().toISOString(),
      });

      // 2. Log hash on-chain
      let onChainResult = null;
      try {
        const payload = { type, summary, actor: req.user.userId, timestamp: activity.created_at, ...metadata };
        const activityTypeNum = ACTIVITY_TYPES[type];
        const cId = contactId || ("0x" + "0".repeat(64));
        const dId = dealId    || ("0x" + "0".repeat(64));

        onChainResult = await blockchain.logActivity(orgId, cId, dId, payload, activityTypeNum);
      } catch (bcErr) {
        console.warn("ActivityLedger on-chain log failed (non-fatal):", bcErr.message);
      }

      res.status(201).json({
        ...activity,
        txHash: onChainResult?.txHash,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /activities/:id ──────────────────────────────────────────────────────
router.get(
  "/:id",
  [param("id").notEmpty()],
  async (req, res, next) => {
    try {
      // Activities aren't fetched by ID in supabase service yet; return from list
      const result = await db.listActivities(req.user.orgId, { limit: 1 });
      const activity = result.activities?.find(a => a.id === req.params.id);
      if (!activity) return res.status(404).json({ error: "Activity not found" });
      res.json(activity);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
