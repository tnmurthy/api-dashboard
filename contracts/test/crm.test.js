// test/crm.test.js – Hardhat/Mocha tests for CRM contracts

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CRM Contract Suite", function () {
  let registry, contactBook, dealPipeline, activityLedger, usageToken, invoiceNFT;
  let owner, admin, salesRep, readOnly, other;

  // ── Fixtures ────────────────────────────────────────────────────────────────

  before(async function () {
    [owner, admin, salesRep, readOnly, other] = await ethers.getSigners();

    // Deploy all contracts
    const CRMRegistry    = await ethers.getContractFactory("CRMRegistry");
    const ContactBook    = await ethers.getContractFactory("ContactBook");
    const DealPipeline   = await ethers.getContractFactory("DealPipeline");
    const ActivityLedger = await ethers.getContractFactory("ActivityLedger");
    const UsageToken     = await ethers.getContractFactory("UsageToken");
    const InvoiceNFT     = await ethers.getContractFactory("InvoiceNFT");

    registry       = await CRMRegistry.deploy();
    contactBook    = await ContactBook.deploy(await registry.getAddress());
    dealPipeline   = await DealPipeline.deploy(await registry.getAddress());
    activityLedger = await ActivityLedger.deploy(await registry.getAddress());
    usageToken     = await UsageToken.deploy(owner.address, 1000);
    invoiceNFT     = await InvoiceNFT.deploy(owner.address);
  });

  // ── CRMRegistry ─────────────────────────────────────────────────────────────

  describe("CRMRegistry", function () {
    let orgId;

    it("registers an organization", async function () {
      const tx = await registry.connect(owner).registerOrg("Test Corp");
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "OrgRegistered");
      orgId = event.args[0];
      expect(orgId).to.not.equal(ethers.ZeroHash);
    });

    it("resolves org by owner", async function () {
      const resolved = await registry.getOrgByOwner(owner.address);
      expect(resolved).to.equal(orgId);
    });

    it("owner has admin role (1)", async function () {
      const role = await registry.getMemberRole(orgId, owner.address);
      expect(role).to.equal(1);
    });

    it("adds a sales rep member", async function () {
      await expect(registry.connect(owner).setMember(orgId, salesRep.address, 2))
        .to.emit(registry, "MemberAdded")
        .withArgs(orgId, salesRep.address, 2);
    });

    it("reverts when non-owner tries to add member", async function () {
      await expect(registry.connect(other).setMember(orgId, readOnly.address, 3))
        .to.be.revertedWith("CRMRegistry: not org owner");
    });

    it("prevents duplicate org registration for same wallet", async function () {
      await expect(registry.connect(owner).registerOrg("Duplicate"))
        .to.be.revertedWith("CRMRegistry: wallet already owns an org");
    });
  });

  // ── ContactBook ─────────────────────────────────────────────────────────────

  describe("ContactBook", function () {
    let orgId, contactId;

    before(async function () {
      orgId = await registry.getOrgByOwner(owner.address);
    });

    const dataHash = ethers.keccak256(ethers.toUtf8Bytes('{"name":"Alice","email":"alice@test.com"}'));

    it("registers a contact", async function () {
      const tx = await contactBook.connect(salesRep).registerContact(orgId, dataHash, "");
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "ContactRegistered");
      contactId = event.args[0];
      expect(contactId).to.not.equal(ethers.ZeroHash);
    });

    it("retrieves the contact", async function () {
      const contact = await contactBook.getContact(contactId);
      expect(contact.dataHash).to.equal(dataHash);
      expect(contact.active).to.be.true;
    });

    it("prevents duplicate hash registration", async function () {
      await expect(contactBook.connect(salesRep).registerContact(orgId, dataHash, ""))
        .to.be.revertedWith("ContactBook: duplicate contact hash");
    });

    it("updates contact data hash", async function () {
      const newHash = ethers.keccak256(ethers.toUtf8Bytes('{"name":"Alice","email":"newalice@test.com"}'));
      await expect(contactBook.connect(salesRep).updateContact(contactId, newHash))
        .to.emit(contactBook, "ContactUpdated");
    });

    it("non-member cannot register contact", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("bob@test.com"));
      await expect(contactBook.connect(other).registerContact(orgId, hash, ""))
        .to.be.revertedWith("ContactBook: insufficient role");
    });
  });

  // ── DealPipeline ─────────────────────────────────────────────────────────────

  describe("DealPipeline", function () {
    let orgId, contactId, dealId;

    before(async function () {
      orgId     = await registry.getOrgByOwner(owner.address);
      // use some contactId (just use orgId as stand-in bytes32 for test)
      contactId = orgId;
    });

    const dealHash = ethers.keccak256(ethers.toUtf8Bytes('{"title":"Big Deal","value":50000}'));

    it("creates a deal", async function () {
      const tx = await dealPipeline.connect(salesRep).createDeal(
        orgId, contactId, dealHash, salesRep.address, ethers.parseEther("1")
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "DealCreated");
      dealId = event.args[0];
      expect(dealId).to.not.equal(ethers.ZeroHash);
    });

    it("starts at Lead stage (0)", async function () {
      const deal = await dealPipeline.getDeal(dealId);
      expect(deal.stage).to.equal(0);
    });

    it("advances to Qualified (1)", async function () {
      const notesHash = ethers.keccak256(ethers.toUtf8Bytes("Qualified after discovery call"));
      await expect(dealPipeline.connect(salesRep).advanceStage(dealId, 1, notesHash))
        .to.emit(dealPipeline, "DealStageAdvanced")
        .withArgs(dealId, orgId, 0, 1, salesRep.address, notesHash, await getTimestamp());
    });

    it("cannot go backwards", async function () {
      const notesHash = ethers.ZeroHash;
      await expect(dealPipeline.connect(salesRep).advanceStage(dealId, 0, notesHash))
        .to.be.revertedWith("DealPipeline: must advance stage forward");
    });

    it("closes deal as ClosedWon (4)", async function () {
      const notes = ethers.keccak256(ethers.toUtf8Bytes("Proposal → Negotiation → Won"));
      await dealPipeline.connect(salesRep).advanceStage(dealId, 2, notes);
      await dealPipeline.connect(salesRep).advanceStage(dealId, 3, notes);
      await expect(dealPipeline.connect(salesRep).advanceStage(dealId, 4, notes))
        .to.emit(dealPipeline, "DealClosed");
      const deal = await dealPipeline.getDeal(dealId);
      expect(deal.active).to.be.false;
    });
  });

  // ── ActivityLedger ──────────────────────────────────────────────────────────

  describe("ActivityLedger", function () {
    let orgId;

    before(async function () {
      orgId = await registry.getOrgByOwner(owner.address);
    });

    it("logs an activity entry", async function () {
      const payloadHash = ethers.keccak256(ethers.toUtf8Bytes('{"type":"call","duration":300}'));
      await expect(
        activityLedger.connect(salesRep).log(orgId, ethers.ZeroHash, ethers.ZeroHash, payloadHash, 0)
      )
        .to.emit(activityLedger, "ActivityLogged")
        .withArgs(0, orgId, ethers.ZeroHash, ethers.ZeroHash, payloadHash, 0, salesRep.address, await getTimestamp());
    });

    it("retrieves the entry", async function () {
      const entry = await activityLedger.getEntry(0);
      expect(entry.actor).to.equal(salesRep.address);
    });

    it("non-member cannot log", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("event"));
      await expect(
        activityLedger.connect(other).log(orgId, ethers.ZeroHash, ethers.ZeroHash, hash, 0)
      ).to.be.revertedWith("ActivityLedger: not an org member");
    });

    it("batch logs up to 50 entries", async function () {
      const n = 3;
      const orgIds      = Array(n).fill(orgId);
      const contacts    = Array(n).fill(ethers.ZeroHash);
      const deals       = Array(n).fill(ethers.ZeroHash);
      const hashes      = Array.from({ length: n }, (_, i) =>
        ethers.keccak256(ethers.toUtf8Bytes(`batch-${i}`))
      );
      const types       = Array(n).fill(0);
      await expect(activityLedger.connect(salesRep).logBatch(orgIds, contacts, deals, hashes, types))
        .to.not.be.reverted;
      expect(await activityLedger.totalEntries()).to.equal(BigInt(n + 1));
    });
  });

  // ── UsageToken ───────────────────────────────────────────────────────────────

  describe("UsageToken", function () {
    it("mints credits to a user", async function () {
      await usageToken.connect(owner).mint(salesRep.address, 100);
      expect(await usageToken.balanceOf(salesRep.address)).to.equal(100);
    });

    it("user can stake credits", async function () {
      await usageToken.connect(salesRep).stake(50);
      expect(await usageToken.stakedBalance(salesRep.address)).to.equal(50);
    });

    it("user can unstake", async function () {
      await usageToken.connect(salesRep).unstake(10);
      expect(await usageToken.stakedBalance(salesRep.address)).to.equal(40);
    });

    it("burner can deduct staked credits", async function () {
      const BURNER_ROLE = await usageToken.BURNER_ROLE();
      await usageToken.connect(owner).grantRole(BURNER_ROLE, owner.address);

      const usageRef = ethers.keccak256(ethers.toUtf8Bytes("invoice-001"));
      await expect(usageToken.connect(owner).deduct(salesRep.address, 10, usageRef))
        .to.emit(usageToken, "CreditsDeducted");
      expect(await usageToken.stakedBalance(salesRep.address)).to.equal(30);
    });

    it("transfers are disabled by default", async function () {
      await expect(usageToken.connect(salesRep).transfer(other.address, 1))
        .to.be.revertedWith("UsageToken: transfers disabled");
    });
  });

  // ── InvoiceNFT ───────────────────────────────────────────────────────────────

  describe("InvoiceNFT", function () {
    let tokenId;
    let orgId;

    before(async function () {
      orgId = await registry.getOrgByOwner(owner.address);
    });

    it("mints an invoice NFT", async function () {
      const metaHash = ethers.keccak256(ethers.toUtf8Bytes('{"amount":100,"credits":1000}'));
      const now = Math.floor(Date.now() / 1000);
      const tx = await invoiceNFT.connect(owner).mintInvoice(
        owner.address, orgId, ethers.parseEther("0.1"), 1000,
        now, now + 2592000, metaHash, "ipfs://QmTest"
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "InvoiceMinted");
      tokenId = event.args[0];
      expect(await invoiceNFT.ownerOf(tokenId)).to.equal(owner.address);
    });

    it("retrieves invoice metadata", async function () {
      const inv = await invoiceNFT.getInvoice(tokenId);
      expect(inv.orgId).to.equal(orgId);
      expect(inv.settled).to.be.false;
    });

    it("settles an invoice", async function () {
      await expect(invoiceNFT.connect(owner).settleInvoice(tokenId))
        .to.emit(invoiceNFT, "InvoiceSettled");
      const inv = await invoiceNFT.getInvoice(tokenId);
      expect(inv.settled).to.be.true;
    });
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function getTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
