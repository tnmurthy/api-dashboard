"use strict";

const { ethers } = require("ethers");
const fs         = require("fs");
const path       = require("path");

// ─── ABIs (minimal interfaces for backend calls) ─────────────────────────────

const REGISTRY_ABI = [
  "function registerOrg(string name) returns (bytes32)",
  "function getOrgByOwner(address owner) view returns (bytes32)",
  "function getMemberRole(bytes32 orgId, address member) view returns (uint8)",
  "function setMember(bytes32 orgId, address member, uint8 role)",
  "event OrgRegistered(bytes32 indexed orgId, address indexed owner, string name, uint256 timestamp)",
];

const CONTACT_BOOK_ABI = [
  "function registerContact(bytes32 orgId, bytes32 dataHash, string didUri) returns (bytes32)",
  "function updateContact(bytes32 contactId, bytes32 newHash)",
  "function deactivateContact(bytes32 contactId)",
  "function grantConsent(bytes32 contactId)",
  "function revokeConsent(bytes32 contactId)",
  "function getContact(bytes32 contactId) view returns (tuple(bytes32 id, bytes32 orgId, bytes32 dataHash, address registeredBy, uint256 createdAt, uint256 updatedAt, bool active, string didUri))",
  "event ContactRegistered(bytes32 indexed contactId, bytes32 indexed orgId, bytes32 dataHash, address registeredBy, uint256 timestamp)",
];

const DEAL_PIPELINE_ABI = [
  "function createDeal(bytes32 orgId, bytes32 contactId, bytes32 dataHash, address assignedTo, uint256 valueWei) returns (bytes32)",
  "function advanceStage(bytes32 dealId, uint8 newStage, bytes32 notesHash)",
  "function reassignDeal(bytes32 dealId, address newAssignee)",
  "function getDeal(bytes32 dealId) view returns (tuple(bytes32 id, bytes32 orgId, bytes32 contactId, bytes32 dataHash, address assignedTo, address createdBy, uint256 valueWei, uint256 createdAt, uint256 updatedAt, uint8 stage, bool active))",
  "event DealStageAdvanced(bytes32 indexed dealId, bytes32 indexed orgId, uint8 from, uint8 to, address actor, bytes32 notesHash, uint256 timestamp)",
];

const ACTIVITY_LEDGER_ABI = [
  "function log(bytes32 orgId, bytes32 contactId, bytes32 dealId, bytes32 payloadHash, uint8 activityType) returns (uint256)",
  "function logBatch(bytes32[] orgIds, bytes32[] contactIds, bytes32[] dealIds, bytes32[] payloadHashes, uint8[] activityTypes)",
  "function totalEntries() view returns (uint256)",
  "function getOrgActivity(bytes32 orgId, uint256 offset, uint256 limit) view returns (tuple(uint256 index, bytes32 orgId, bytes32 contactId, bytes32 dealId, bytes32 payloadHash, uint8 activityType, address actor, uint256 timestamp)[])",
];

const USAGE_TOKEN_ABI = [
  "function mint(address to, uint256 amount)",
  "function deduct(address account, uint256 amount, bytes32 usageRef)",
  "function balanceOf(address account) view returns (uint256)",
  "function stakedBalance(address account) view returns (uint256)",
];

const INVOICE_NFT_ABI = [
  "function mintInvoice(address to, bytes32 orgId, uint256 amountWei, uint256 creditsGranted, uint256 periodStart, uint256 periodEnd, bytes32 metadataHash, string tokenUri) returns (uint256)",
  "function settleInvoice(uint256 tokenId)",
  "function getInvoice(uint256 tokenId) view returns (tuple(uint256 tokenId, bytes32 orgId, address paidBy, uint256 amountWei, uint256 creditsGranted, uint256 periodStart, uint256 periodEnd, uint256 issuedAt, bytes32 metadataHash, bool settled))",
];

// ─── Provider & Signer ───────────────────────────────────────────────────────

let _provider = null;
let _signer   = null;

function getProvider() {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545"
    );
  }
  return _provider;
}

function getSigner() {
  if (!_signer) {
    const pk = process.env.BACKEND_SIGNER_PRIVATE_KEY;
    if (!pk) throw new Error("BACKEND_SIGNER_PRIVATE_KEY not set");
    _signer = new ethers.Wallet(pk, getProvider());
  }
  return _signer;
}

// ─── Contract factories ──────────────────────────────────────────────────────

function loadAddresses() {
  // Try deployments.json first; fall back to env vars
  const jsonPath = path.join(__dirname, "../../contracts/deployments.json");
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  }
  return {
    CRMRegistry:    process.env.CONTRACT_CRM_REGISTRY,
    ContactBook:    process.env.CONTRACT_CONTACT_BOOK,
    DealPipeline:   process.env.CONTRACT_DEAL_PIPELINE,
    ActivityLedger: process.env.CONTRACT_ACTIVITY_LEDGER,
    UsageToken:     process.env.CONTRACT_USAGE_TOKEN,
    InvoiceNFT:     process.env.CONTRACT_INVOICE_NFT,
  };
}

function getContract(name, abi) {
  const addrs = loadAddresses();
  const addr  = addrs[name];
  if (!addr) throw new Error(`Contract address for ${name} not configured`);
  return new ethers.Contract(addr, abi, getSigner());
}

// ─── Public helpers ──────────────────────────────────────────────────────────

/**
 * Hash a JavaScript object (contact / deal / activity payload) using keccak256.
 * This is what gets stored on-chain; the full object stays in Supabase.
 */
function hashPayload(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
}

// ─── CRMRegistry ─────────────────────────────────────────────────────────────

async function registerOrg(name) {
  const contract = getContract("CRMRegistry", REGISTRY_ABI);
  const tx       = await contract.registerOrg(name);
  const receipt  = await tx.wait();
  const event    = receipt.logs.find(l => l.fragment?.name === "OrgRegistered");
  return { orgId: event.args[0], txHash: receipt.hash };
}

async function getOrgIdByOwner(ownerAddress) {
  const contract = getContract("CRMRegistry", REGISTRY_ABI);
  return contract.getOrgByOwner(ownerAddress);
}

async function setOrgMember(orgId, memberAddress, role) {
  const contract = getContract("CRMRegistry", REGISTRY_ABI);
  const tx       = await contract.setMember(orgId, memberAddress, role);
  const receipt  = await tx.wait();
  return { txHash: receipt.hash };
}

// ─── ContactBook ─────────────────────────────────────────────────────────────

async function registerContact(orgId, contactPayload, didUri = "") {
  const dataHash = hashPayload(contactPayload);
  const contract = getContract("ContactBook", CONTACT_BOOK_ABI);
  const tx       = await contract.registerContact(orgId, dataHash, didUri);
  const receipt  = await tx.wait();
  const event    = receipt.logs.find(l => l.fragment?.name === "ContactRegistered");
  return { contactId: event.args[0], dataHash, txHash: receipt.hash };
}

async function updateContactHash(contactId, newPayload) {
  const newHash  = hashPayload(newPayload);
  const contract = getContract("ContactBook", CONTACT_BOOK_ABI);
  const tx       = await contract.updateContact(contactId, newHash);
  const receipt  = await tx.wait();
  return { newHash, txHash: receipt.hash };
}

async function deactivateContactOnChain(contactId) {
  const contract = getContract("ContactBook", CONTACT_BOOK_ABI);
  const tx       = await contract.deactivateContact(contactId);
  const receipt  = await tx.wait();
  return { txHash: receipt.hash };
}

// ─── DealPipeline ─────────────────────────────────────────────────────────────

async function createDeal(orgId, contactId, dealPayload, assignedTo, valueWei) {
  const dataHash = hashPayload(dealPayload);
  const contract = getContract("DealPipeline", DEAL_PIPELINE_ABI);
  const tx       = await contract.createDeal(orgId, contactId, dataHash, assignedTo, valueWei);
  const receipt  = await tx.wait();
  const event    = receipt.logs.find(l => l.fragment?.name === "DealCreated");
  const dealId   = event?.args?.[0] ?? null;
  return { dealId, dataHash, txHash: receipt.hash };
}

async function advanceDealStage(dealId, newStage, notesPayload) {
  const notesHash = notesPayload ? hashPayload(notesPayload) : ethers.ZeroHash;
  const contract  = getContract("DealPipeline", DEAL_PIPELINE_ABI);
  const tx        = await contract.advanceStage(dealId, newStage, notesHash);
  const receipt   = await tx.wait();
  return { notesHash, txHash: receipt.hash };
}

// ─── ActivityLedger ──────────────────────────────────────────────────────────

/**
 * @param {string}  orgId
 * @param {string}  contactId   bytes32 hex (or ethers.ZeroHash)
 * @param {string}  dealId      bytes32 hex (or ethers.ZeroHash)
 * @param {object}  payload     Full activity data object (hashed before storing on-chain)
 * @param {number}  activityType  0=Call,1=Email,2=Meeting,3=Note,4=ApiUsage,5=DealUpdate,6=Custom
 */
async function logActivity(orgId, contactId, dealId, payload, activityType) {
  const payloadHash = hashPayload(payload);
  const contract    = getContract("ActivityLedger", ACTIVITY_LEDGER_ABI);
  const tx          = await contract.log(orgId, contactId, dealId, payloadHash, activityType);
  const receipt     = await tx.wait();
  return { payloadHash, txHash: receipt.hash };
}

// ─── UsageToken ──────────────────────────────────────────────────────────────

async function mintCredits(toAddress, amount) {
  const contract = getContract("UsageToken", USAGE_TOKEN_ABI);
  const tx       = await contract.mint(toAddress, amount);
  const receipt  = await tx.wait();
  return { txHash: receipt.hash };
}

async function deductCredits(account, amount, usageRef) {
  const refHash  = ethers.keccak256(ethers.toUtf8Bytes(String(usageRef)));
  const contract = getContract("UsageToken", USAGE_TOKEN_ABI);
  const tx       = await contract.deduct(account, amount, refHash);
  const receipt  = await tx.wait();
  return { txHash: receipt.hash };
}

async function getCreditBalance(address) {
  const contract = getContract("UsageToken", USAGE_TOKEN_ABI);
  const [balance, staked] = await Promise.all([
    contract.balanceOf(address),
    contract.stakedBalance(address),
  ]);
  return { balance: balance.toString(), staked: staked.toString() };
}

// ─── InvoiceNFT ──────────────────────────────────────────────────────────────

async function mintInvoice(to, orgId, amountWei, creditsGranted, periodStart, periodEnd, metadata, tokenUri) {
  const metaHash = hashPayload(metadata);
  const contract = getContract("InvoiceNFT", INVOICE_NFT_ABI);
  const tx       = await contract.mintInvoice(
    to, orgId, amountWei, creditsGranted, periodStart, periodEnd, metaHash, tokenUri
  );
  const receipt = await tx.wait();
  const event   = receipt.logs.find(l => l.fragment?.name === "InvoiceMinted");
  const tokenId = event?.args?.[0]?.toString() ?? null;
  return { tokenId, metaHash, txHash: receipt.hash };
}

module.exports = {
  hashPayload,
  getProvider,
  // Registry
  registerOrg, getOrgIdByOwner, setOrgMember,
  // Contacts
  registerContact, updateContactHash, deactivateContactOnChain,
  // Deals
  createDeal, advanceDealStage,
  // Activities
  logActivity,
  // Billing
  mintCredits, deductCredits, getCreditBalance, mintInvoice,
};
