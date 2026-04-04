"use strict";

const { createClient } = require("@supabase/supabase-js");

let _client = null;

/**
 * Returns a singleton Supabase admin client.
 * Uses the service key so it bypasses RLS – only call from the backend.
 */
function getClient() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
    }

    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

// ─── Contacts ────────────────────────────────────────────────────────────────

async function createContact(orgId, contactData) {
  const db = getClient();
  const { data, error } = await db
    .from("contacts")
    .insert({ ...contactData, org_id: orgId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getContact(orgId, contactId) {
  const db = getClient();
  const { data, error } = await db
    .from("contacts")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", contactId)
    .single();
  if (error) throw error;
  return data;
}

async function listContacts(orgId, { page = 1, limit = 20, search } = {}) {
  const db  = getClient();
  let query = db
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .eq("active", true)
    .range((page - 1) * limit, page * limit - 1)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { contacts: data, total: count, page, limit };
}

async function updateContact(orgId, contactId, updates) {
  const db = getClient();
  const { data, error } = await db
    .from("contacts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", contactId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deactivateContact(orgId, contactId) {
  const db = getClient();
  const { data, error } = await db
    .from("contacts")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", contactId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Deals ────────────────────────────────────────────────────────────────────

async function createDeal(orgId, dealData) {
  const db = getClient();
  const { data, error } = await db
    .from("deals")
    .insert({ ...dealData, org_id: orgId, stage: "lead" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getDeal(orgId, dealId) {
  const db = getClient();
  const { data, error } = await db
    .from("deals")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", dealId)
    .single();
  if (error) throw error;
  return data;
}

async function listDeals(orgId, { stage, assignedTo, page = 1, limit = 20 } = {}) {
  const db  = getClient();
  let query = db
    .from("deals")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .range((page - 1) * limit, page * limit - 1)
    .order("created_at", { ascending: false });

  if (stage)      query = query.eq("stage", stage);
  if (assignedTo) query = query.eq("assigned_to", assignedTo);

  const { data, error, count } = await query;
  if (error) throw error;
  return { deals: data, total: count, page, limit };
}

async function updateDeal(orgId, dealId, updates) {
  const db = getClient();
  const { data, error } = await db
    .from("deals")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", dealId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Activities ───────────────────────────────────────────────────────────────

async function createActivity(orgId, activityData) {
  const db = getClient();
  const { data, error } = await db
    .from("activities")
    .insert({ ...activityData, org_id: orgId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function listActivities(orgId, { contactId, dealId, page = 1, limit = 50 } = {}) {
  const db  = getClient();
  let query = db
    .from("activities")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .range((page - 1) * limit, page * limit - 1)
    .order("created_at", { ascending: false });

  if (contactId) query = query.eq("contact_id", contactId);
  if (dealId)    query = query.eq("deal_id",    dealId);

  const { data, error, count } = await query;
  if (error) throw error;
  return { activities: data, total: count, page, limit };
}

// ─── Billing ──────────────────────────────────────────────────────────────────

async function createInvoiceRecord(orgId, invoiceData) {
  const db = getClient();
  const { data, error } = await db
    .from("invoices")
    .insert({ ...invoiceData, org_id: orgId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function listInvoices(orgId, { page = 1, limit = 20 } = {}) {
  const db = getClient();
  const { data, error, count } = await db
    .from("invoices")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .range((page - 1) * limit, page * limit - 1)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { invoices: data, total: count, page, limit };
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function getUserByEmail(email) {
  const db = getClient();
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

async function getUserByWallet(walletAddress) {
  const db = getClient();
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

async function createUser(userData) {
  const db = getClient();
  const { data, error } = await db
    .from("users")
    .insert(userData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateUser(userId, updates) {
  const db = getClient();
  const { data, error } = await db
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  createContact,  getContact,  listContacts,  updateContact, deactivateContact,
  createDeal,     getDeal,     listDeals,     updateDeal,
  createActivity, listActivities,
  createInvoiceRecord, listInvoices,
  getUserByEmail, getUserByWallet, createUser, updateUser,
};
