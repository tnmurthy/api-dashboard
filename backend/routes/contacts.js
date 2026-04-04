"use strict";

const express = require("express");
const { body, query, param, validationResult } = require("express-validator");

const db         = require("../services/supabase");
const blockchain = require("../services/blockchain");
const { requireSalesOrAdmin, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ─── GET /contacts ────────────────────────────────────────────────────────────
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("search").optional().trim().escape(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const result = await db.listContacts(req.user.orgId, {
        page:   req.query.page  || 1,
        limit:  req.query.limit || 20,
        search: req.query.search,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /contacts ───────────────────────────────────────────────────────────
router.post(
  "/",
  requireSalesOrAdmin,
  [
    body("name").notEmpty().trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("company").optional().trim(),
    body("phone").optional().trim(),
    body("tags").optional().isArray(),
    body("didUri").optional().trim(),
    body("walletAddress").optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, company, phone, tags, didUri, walletAddress } = req.body;
    const orgId = req.user.orgId;

    try {
      // 1. Build canonical payload for hashing (only non-PII fields in hash)
      const hashPayload = { name, email, company, walletAddress: walletAddress || null };

      // 2. Write to Supabase (PII stored off-chain)
      const contact = await db.createContact(orgId, {
        name, email, company, phone,
        tags:            tags || [],
        wallet_address:  walletAddress || null,
        did_uri:         didUri || null,
        created_by:      req.user.userId,
        active:          true,
        created_at:      new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      });

      // 3. Register hash on-chain (non-blocking; log failure but don't fail the request)
      let onChainResult = null;
      try {
        onChainResult = await blockchain.registerContact(orgId, hashPayload, didUri || "");
        await db.updateContact(orgId, contact.id, {
          on_chain_id:   onChainResult.contactId,
          data_hash:     onChainResult.dataHash,
          chain_tx_hash: onChainResult.txHash,
        });
      } catch (bcErr) {
        console.warn("ContactBook on-chain registration failed (non-fatal):", bcErr.message);
      }

      res.status(201).json({
        ...contact,
        onChainId: onChainResult?.contactId,
        txHash:    onChainResult?.txHash,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /contacts/:id ────────────────────────────────────────────────────────
router.get(
  "/:id",
  [param("id").notEmpty()],
  async (req, res, next) => {
    try {
      const contact = await db.getContact(req.user.orgId, req.params.id);
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      res.json(contact);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /contacts/:id ──────────────────────────────────────────────────────
router.patch(
  "/:id",
  requireSalesOrAdmin,
  [
    param("id").notEmpty(),
    body("name").optional().trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("company").optional().trim(),
    body("phone").optional().trim(),
    body("tags").optional().isArray(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const orgId     = req.user.orgId;
    const contactId = req.params.id;

    try {
      const existing = await db.getContact(orgId, contactId);
      if (!existing) return res.status(404).json({ error: "Contact not found" });

      const updates = {};
      ["name", "email", "company", "phone", "tags"].forEach(f => {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      });

      const updated = await db.updateContact(orgId, contactId, updates);

      // Update on-chain hash if contact has an on-chain ID
      if (existing.on_chain_id) {
        try {
          const newPayload = {
            name:          updated.name,
            email:         updated.email,
            company:       updated.company,
            walletAddress: updated.wallet_address,
          };
          const result = await blockchain.updateContactHash(existing.on_chain_id, newPayload);
          await db.updateContact(orgId, contactId, {
            data_hash:     result.newHash,
            chain_tx_hash: result.txHash,
          });
        } catch (bcErr) {
          console.warn("ContactBook on-chain update failed (non-fatal):", bcErr.message);
        }
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /contacts/:id ─────────────────────────────────────────────────────
router.delete(
  "/:id",
  requireAdmin,
  [param("id").notEmpty()],
  async (req, res, next) => {
    const orgId     = req.user.orgId;
    const contactId = req.params.id;

    try {
      const existing = await db.getContact(orgId, contactId);
      if (!existing) return res.status(404).json({ error: "Contact not found" });

      await db.deactivateContact(orgId, contactId);

      if (existing.on_chain_id) {
        try {
          await blockchain.deactivateContactOnChain(existing.on_chain_id);
        } catch (bcErr) {
          console.warn("ContactBook on-chain deactivation failed (non-fatal):", bcErr.message);
        }
      }

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
