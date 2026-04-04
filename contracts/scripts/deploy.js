// deploy.js – Hardhat deployment script for all CRM contracts
// Usage: npx hardhat run scripts/deploy.js --network <network>

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ── 1. CRMRegistry ──────────────────────────────────────────────────────────
  console.log("Deploying CRMRegistry...");
  const CRMRegistry = await ethers.getContractFactory("CRMRegistry");
  const registry = await CRMRegistry.deploy();
  await registry.waitForDeployment();
  console.log("  CRMRegistry:", await registry.getAddress());

  // ── 2. ContactBook ──────────────────────────────────────────────────────────
  console.log("Deploying ContactBook...");
  const ContactBook = await ethers.getContractFactory("ContactBook");
  const contactBook = await ContactBook.deploy(await registry.getAddress());
  await contactBook.waitForDeployment();
  console.log("  ContactBook:", await contactBook.getAddress());

  // ── 3. DealPipeline ─────────────────────────────────────────────────────────
  console.log("Deploying DealPipeline...");
  const DealPipeline = await ethers.getContractFactory("DealPipeline");
  const dealPipeline = await DealPipeline.deploy(await registry.getAddress());
  await dealPipeline.waitForDeployment();
  console.log("  DealPipeline:", await dealPipeline.getAddress());

  // ── 4. ActivityLedger ───────────────────────────────────────────────────────
  console.log("Deploying ActivityLedger...");
  const ActivityLedger = await ethers.getContractFactory("ActivityLedger");
  const activityLedger = await ActivityLedger.deploy(await registry.getAddress());
  await activityLedger.waitForDeployment();
  console.log("  ActivityLedger:", await activityLedger.getAddress());

  // ── 5. UsageToken ───────────────────────────────────────────────────────────
  console.log("Deploying UsageToken...");
  const CREDIT_RATIO = 1000; // 1 credit = 1,000 API tokens
  const UsageToken = await ethers.getContractFactory("UsageToken");
  const usageToken = await UsageToken.deploy(deployer.address, CREDIT_RATIO);
  await usageToken.waitForDeployment();
  console.log("  UsageToken:", await usageToken.getAddress());

  // ── 6. InvoiceNFT ───────────────────────────────────────────────────────────
  console.log("Deploying InvoiceNFT...");
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const invoiceNFT = await InvoiceNFT.deploy(deployer.address);
  await invoiceNFT.waitForDeployment();
  console.log("  InvoiceNFT:", await invoiceNFT.getAddress());

  // ── Save addresses to JSON ──────────────────────────────────────────────────
  const network = await ethers.provider.getNetwork();
  const addresses = {
    network:       network.name,
    chainId:       network.chainId.toString(),
    deployedAt:    new Date().toISOString(),
    deployer:      deployer.address,
    CRMRegistry:   await registry.getAddress(),
    ContactBook:   await contactBook.getAddress(),
    DealPipeline:  await dealPipeline.getAddress(),
    ActivityLedger: await activityLedger.getAddress(),
    UsageToken:    await usageToken.getAddress(),
    InvoiceNFT:    await invoiceNFT.getAddress(),
  };

  const outPath = path.join(__dirname, "..", "deployments.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\n✓ Deployment complete. Addresses saved to contracts/deployments.json");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
