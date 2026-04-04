import {
  BigInt, Bytes, store
} from "@graphprotocol/graph-ts";

import {
  OrgRegistered,
  MemberAdded,
  MemberRemoved,
  OrgDeactivated,
} from "../generated/CRMRegistry/CRMRegistry";

import {
  ContactRegistered,
  ContactUpdated,
  ContactDeactivated,
  ConsentGranted,
  ConsentRevoked,
} from "../generated/ContactBook/ContactBook";

import {
  DealCreated,
  DealStageAdvanced,
  DealClosed,
  DealReassigned,
} from "../generated/DealPipeline/DealPipeline";

import {
  ActivityLogged,
} from "../generated/ActivityLedger/ActivityLedger";

import {
  InvoiceMinted,
  InvoiceSettled,
} from "../generated/InvoiceNFT/InvoiceNFT";

import {
  Organization,
  OrgMember,
  Contact,
  Deal,
  DealStageChange,
  ActivityEntry,
  Invoice,
  OrgStats,
} from "../generated/schema";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOrCreateOrgStats(orgId: Bytes, timestamp: BigInt): OrgStats {
  const statsId = orgId.toHexString();
  let stats = OrgStats.load(statsId);
  if (!stats) {
    stats = new OrgStats(statsId);
    stats.org                 = orgId.toHexString();
    stats.totalContacts       = BigInt.fromI32(0);
    stats.totalDeals          = BigInt.fromI32(0);
    stats.openDeals           = BigInt.fromI32(0);
    stats.closedWonDeals      = BigInt.fromI32(0);
    stats.closedLostDeals     = BigInt.fromI32(0);
    stats.totalActivities     = BigInt.fromI32(0);
    stats.totalInvoiceAmount  = BigInt.fromI32(0);
    stats.lastUpdated         = timestamp;
  }
  return stats as OrgStats;
}

// ─── CRMRegistry Handlers ────────────────────────────────────────────────────

export function handleOrgRegistered(event: OrgRegistered): void {
  const org   = new Organization(event.params.orgId.toHexString());
  org.owner   = event.params.owner;
  org.name    = event.params.name;
  org.createdAt = event.params.timestamp;
  org.active  = true;
  org.save();

  // Create admin member entry
  const memberId = event.params.orgId.toHexString() + "-" + event.params.owner.toHexString();
  const member   = new OrgMember(memberId);
  member.org     = org.id;
  member.wallet  = event.params.owner;
  member.role    = 1;
  member.addedAt = event.params.timestamp;
  member.active  = true;
  member.save();

  getOrCreateOrgStats(event.params.orgId, event.params.timestamp).save();
}

export function handleMemberAdded(event: MemberAdded): void {
  const memberId = event.params.orgId.toHexString() + "-" + event.params.member.toHexString();
  let member = OrgMember.load(memberId);
  if (!member) {
    member        = new OrgMember(memberId);
    member.org    = event.params.orgId.toHexString();
    member.wallet = event.params.member;
    member.addedAt = event.block.timestamp;
  }
  member.role   = event.params.role;
  member.active = true;
  member.save();
}

export function handleMemberRemoved(event: MemberRemoved): void {
  const memberId = event.params.orgId.toHexString() + "-" + event.params.member.toHexString();
  const member = OrgMember.load(memberId);
  if (member) {
    member.active = false;
    member.save();
  }
}

export function handleOrgDeactivated(event: OrgDeactivated): void {
  const org = Organization.load(event.params.orgId.toHexString());
  if (org) {
    org.active = false;
    org.save();
  }
}

// ─── ContactBook Handlers ─────────────────────────────────────────────────────

export function handleContactRegistered(event: ContactRegistered): void {
  const contact = new Contact(event.params.contactId.toHexString());
  contact.org           = event.params.orgId.toHexString();
  contact.dataHash      = event.params.dataHash;
  contact.registeredBy  = event.params.registeredBy;
  contact.createdAt     = event.params.timestamp;
  contact.updatedAt     = event.params.timestamp;
  contact.active        = true;
  contact.consentGranted = false;
  contact.save();

  const stats = getOrCreateOrgStats(event.params.orgId, event.params.timestamp);
  stats.totalContacts = stats.totalContacts.plus(BigInt.fromI32(1));
  stats.lastUpdated   = event.params.timestamp;
  stats.save();
}

export function handleContactUpdated(event: ContactUpdated): void {
  const contact = Contact.load(event.params.contactId.toHexString());
  if (contact) {
    contact.dataHash  = event.params.newHash;
    contact.updatedAt = event.params.timestamp;
    contact.save();
  }
}

export function handleContactDeactivated(event: ContactDeactivated): void {
  const contact = Contact.load(event.params.contactId.toHexString());
  if (contact) {
    contact.active    = false;
    contact.updatedAt = event.params.timestamp;
    contact.save();
  }
}

export function handleConsentGranted(event: ConsentGranted): void {
  const contact = Contact.load(event.params.contactId.toHexString());
  if (contact) {
    contact.consentGranted = true;
    contact.save();
  }
}

export function handleConsentRevoked(event: ConsentRevoked): void {
  const contact = Contact.load(event.params.contactId.toHexString());
  if (contact) {
    contact.consentGranted = false;
    contact.save();
  }
}

// ─── DealPipeline Handlers ────────────────────────────────────────────────────

export function handleDealCreated(event: DealCreated): void {
  const deal = new Deal(event.params.dealId.toHexString());
  deal.org        = event.params.orgId.toHexString();
  deal.contact    = event.params.contactId.toHexString();
  // dataHash is not emitted in DealCreated event; the backend stores it off-chain
  // and updates via The Graph when available. Use empty bytes32 as placeholder.
  deal.dataHash   = event.params.dealId; // use dealId as self-referencing placeholder
  deal.assignedTo = event.params.assignedTo;
  deal.createdBy  = event.transaction.from;
  deal.valueWei   = event.params.valueWei;
  deal.createdAt  = event.params.timestamp;
  deal.updatedAt  = event.params.timestamp;
  deal.stage      = event.params.initialStage;
  deal.active     = true;
  deal.save();

  const stats = getOrCreateOrgStats(event.params.orgId, event.params.timestamp);
  stats.totalDeals = stats.totalDeals.plus(BigInt.fromI32(1));
  stats.openDeals  = stats.openDeals.plus(BigInt.fromI32(1));
  stats.lastUpdated = event.params.timestamp;
  stats.save();
}

export function handleDealStageAdvanced(event: DealStageAdvanced): void {
  const deal = Deal.load(event.params.dealId.toHexString());
  if (deal) {
    deal.stage     = event.params.to;
    deal.updatedAt = event.params.timestamp;
    deal.save();
  }

  const changeId = event.params.dealId.toHexString() + "-" + event.params.timestamp.toString();
  const change   = new DealStageChange(changeId);
  change.deal       = event.params.dealId.toHexString();
  change.fromStage  = event.params.from;
  change.toStage    = event.params.to;
  change.actor      = event.params.actor;
  change.notesHash  = event.params.notesHash;
  change.timestamp  = event.params.timestamp;
  change.save();
}

export function handleDealClosed(event: DealClosed): void {
  const deal = Deal.load(event.params.dealId.toHexString());
  if (!deal) return;

  deal.active    = false;
  deal.updatedAt = event.params.timestamp;
  deal.stage     = event.params.outcome;
  deal.save();

  const stats = getOrCreateOrgStats(Bytes.fromHexString(deal.org), event.params.timestamp);
  stats.openDeals = stats.openDeals.minus(BigInt.fromI32(1));
  if (event.params.outcome == 4) {
    stats.closedWonDeals  = stats.closedWonDeals.plus(BigInt.fromI32(1));
  } else {
    stats.closedLostDeals = stats.closedLostDeals.plus(BigInt.fromI32(1));
  }
  stats.lastUpdated = event.params.timestamp;
  stats.save();
}

export function handleDealReassigned(event: DealReassigned): void {
  const deal = Deal.load(event.params.dealId.toHexString());
  if (deal) {
    deal.assignedTo = event.params.to;
    deal.updatedAt  = event.params.timestamp;
    deal.save();
  }
}

// ─── ActivityLedger Handlers ──────────────────────────────────────────────────

export function handleActivityLogged(event: ActivityLogged): void {
  const entryId = event.params.index.toString();
  const entry   = new ActivityEntry(entryId);
  entry.index        = event.params.index;
  entry.org          = event.params.orgId.toHexString();
  entry.contact      = event.params.contactId.toHexString();
  entry.deal         = event.params.dealId.toHexString();
  entry.payloadHash  = event.params.payloadHash;
  entry.activityType = event.params.activityType;
  entry.actor        = event.params.actor;
  entry.timestamp    = event.params.timestamp;
  entry.save();

  const stats = getOrCreateOrgStats(event.params.orgId, event.params.timestamp);
  stats.totalActivities = stats.totalActivities.plus(BigInt.fromI32(1));
  stats.lastUpdated     = event.params.timestamp;
  stats.save();
}

// ─── InvoiceNFT Handlers ──────────────────────────────────────────────────────

export function handleInvoiceMinted(event: InvoiceMinted): void {
  const invoice = new Invoice(event.params.tokenId.toString());
  invoice.tokenId        = event.params.tokenId;
  invoice.org            = event.params.orgId.toHexString();
  invoice.paidBy         = event.params.paidBy;
  invoice.amountWei      = event.params.amountWei;
  invoice.creditsGranted = event.params.creditsGranted;
  invoice.periodStart    = event.params.periodStart;
  invoice.periodEnd      = event.params.periodEnd;
  invoice.issuedAt       = event.params.issuedAt;
  invoice.metadataHash   = event.params.metadataHash;
  invoice.settled        = false;
  invoice.save();

  const stats = getOrCreateOrgStats(event.params.orgId, event.params.issuedAt);
  stats.totalInvoiceAmount = stats.totalInvoiceAmount.plus(event.params.amountWei);
  stats.lastUpdated        = event.params.issuedAt;
  stats.save();
}

export function handleInvoiceSettled(event: InvoiceSettled): void {
  const invoice = Invoice.load(event.params.tokenId.toString());
  if (invoice) {
    invoice.settled = true;
    invoice.save();
  }
}
