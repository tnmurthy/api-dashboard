# API Command Center — Blockchain-Backed CRM

> **"One more thing..."** — A revolutionary way to manage your AI infrastructure, now with a full on-chain CRM.

A cinematic, presentation-style dashboard for managing AI APIs **and** a complete CRM whose data layer is immutable and verifiable on-chain. Inspired by OpenRouter meets Salesforce, but trustless.

![Status](https://img.shields.io/badge/Status-Production-success)
![Version](https://img.shields.io/badge/Version-3.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-purple)
![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow)

---

## ✨ What's New in v3 — CRM Layer

### 🏗️ Three-Layer Architecture

```
Frontend (Vanilla JS + ethers.js CDN)
        ↕
Backend API (Node.js / Express + JWT)
        ├── Off-chain PII → Supabase (PostgreSQL)
        ├── On-chain hashes → Smart Contracts (Polygon / Base)
        └── Indexed queries → The Graph
```

### 📇 CRM Modules

| Module | Description |
|--------|-------------|
| **Contacts** | Add contacts with on-chain identity hashing (SHA-256/keccak256 of PII → stored on-chain, PII stays in Supabase) |
| **Deal Pipeline** | Kanban-style deal board; stage transitions are signed on-chain transactions |
| **Activity Ledger** | Append-only log of every call, email, and meeting — hashed to chain |
| **Wallet** | MetaMask connect, Sign-In with Ethereum (SIWE), CRMC token balance, Invoice NFTs |

### ⛓️ Smart Contracts

| Contract | Purpose |
|----------|---------|
| `CRMRegistry.sol` | Org registry; maps org → owner wallet; role-based access |
| `ContactBook.sol` | Stores contact data hashes; GDPR-friendly (only hashes on-chain) |
| `DealPipeline.sol` | State machine for deals; immutable stage transition log |
| `ActivityLedger.sol` | Append-only activity log; batch logging for gas efficiency |
| `UsageToken.sol` | ERC-20 API usage credits; staking + burn-on-usage model |
| `InvoiceNFT.sol` | ERC-721 proof-of-payment NFTs minted per billing period |

---

## 🚀 Quick Start

### Option A — Docker Compose (full stack, recommended)

```bash
# 1. Copy env template
cp backend/.env.example backend/.env
# 2. Edit backend/.env with your Supabase keys
# 3. Start everything
docker-compose up
```

This starts:
- Local Hardhat blockchain node on `localhost:8545`
- Auto-deploys all contracts
- Backend API on `localhost:3001`
- Frontend on `localhost:3000`

### Option B — Frontend only (browser demo, no backend)

```bash
# Open index.html directly in your browser
open index.html
```

All CRM features work in demo mode using LocalStorage + browser-side SHA-256 hash simulation.

### Option C — Full production setup

1. **Deploy contracts**
   ```bash
   cd contracts
   npm install
   npx hardhat run scripts/deploy.js --network polygon
   # Addresses saved to contracts/deployments.json
   ```

2. **Configure backend**
   ```bash
   cp backend/.env.example backend/.env
   # Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, BACKEND_SIGNER_PRIVATE_KEY,
   # and the deployed contract addresses from deployments.json
   ```

3. **Start backend**
   ```bash
   cd backend && npm install && npm start
   ```

4. **Deploy The Graph subgraph**
   ```bash
   cd subgraph
   npm install -g @graphprotocol/graph-cli
   graph init --from-example
   # Update subgraph.yaml with deployed contract addresses
   graph deploy --studio crm-command-center
   ```

---

## 📖 Terminal Commands (extended)

| Command | Description |
|---------|-------------|
| `crm contacts` | List all contacts |
| `crm deals` | Deal pipeline summary by stage |
| `crm stats` | Full CRM statistics |
| `wallet status` | Connected wallet address + credit balance |
| `config <app> --primary <model> --fallback <model>` | Configure AI models |
| `list apps \| list models` | List apps/models |
| `help` | All commands |

---

## 🔒 Security & Privacy

- **GDPR-friendly**: PII (name, email) stored in encrypted Supabase. Only `keccak256(canonical_JSON)` stored on-chain.
- **Non-transferable credits**: `UsageToken` transfers disabled by default (soulbound-lite).
- **Role-based access**: Owner (1) / Admin (1) / Sales Rep (2) / Read-only (3) enforced in every contract.
- **Multi-sig intent**: Destructive operations (deactivate contact) require admin role; extend with a multi-sig contract for production.
- **SIWE**: Sign-In with Ethereum — no passwords sent over the wire for wallet users.

---

## 🗂️ File Structure

```
api-dashboard/
├── index.html              # Extended with CRM + Wallet views
├── styles.css              # Extended with CRM component styles
├── app.js                  # AppController + CRMController + WalletController
├── vercel.json
├── docker-compose.yml      # Full-stack local dev
│
├── contracts/              # Solidity smart contracts (Hardhat)
│   ├── CRMRegistry.sol
│   ├── ContactBook.sol
│   ├── DealPipeline.sol
│   ├── ActivityLedger.sol
│   ├── UsageToken.sol
│   ├── InvoiceNFT.sol
│   ├── hardhat.config.js
│   ├── scripts/deploy.js
│   └── test/crm.test.js
│
├── backend/                # Node.js / Express API
│   ├── server.js
│   ├── middleware/auth.js
│   ├── services/supabase.js
│   ├── services/blockchain.js
│   ├── routes/auth.js
│   ├── routes/contacts.js
│   ├── routes/deals.js
│   ├── routes/activities.js
│   ├── routes/billing.js
│   └── .env.example
│
└── subgraph/               # The Graph indexing
    ├── subgraph.yaml
    ├── schema.graphql
    └── src/mapping.ts
```

---

## 🔗 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS, CSS, HTML5, ethers.js (CDN) |
| Backend | Node.js, Express, JWT, bcrypt |
| Blockchain | Solidity 0.8.24, Hardhat, OpenZeppelin |
| Chain | Polygon PoS / Base (EVM-compatible) |
| Off-chain DB | Supabase (PostgreSQL) |
| Indexing | The Graph (GraphQL subgraph) |
| Identity | Sign-In with Ethereum (SIWE / EIP-4361) |
| Storage | IPFS / Filecoin (for invoice metadata) |

---

## 📄 License

MIT — Feel free to use for personal or commercial projects.

**Built with ❤️ for the AI + Web3 revolution**


> **"One more thing..."** - A revolutionary way to manage your AI infrastructure.

A cinematic, presentation-style dashboard for managing AI APIs with command-line power. Inspired by Steve Jobs' iconic presentations and TEDx's bold storytelling.

![API Command Center](https://img.shields.io/badge/Status-Production-success)
![Version](https://img.shields.io/badge/Version-2.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎭 Presentation Dashboard
Navigate through your API metrics like a keynote presentation:
- **Giant, animated stats** - One powerful metric at a time
- **Cinematic transitions** - Smooth slide navigation with keyboard/swipe
- **Real-time data** - Live token usage, costs, and performance

### 💻 Command Terminal
Configure your AI applications via CLI:
```bash
$ config openclaw --primary gpt-4-turbo --fallback claude-3-sonnet
✓ OpenClaw configured successfully

$ list models
Available models:
  • gpt-4-turbo      ($0.01/1k)  [OpenAI]
  • claude-3-opus    ($0.015/1k) [Anthropic]
  • gemini-pro       ($0.0005/1k)[Google]
```

### ⚙️ Visual Configurator
Hybrid interface for power users and beginners:
- Select models visually with live pricing
- See generated commands in real-time
- One-click apply or copy to clipboard
- Export configurations as JSON

### 📊 AI Applications Supported
- **OpenClaw** - AI-powered code assistant
- **MoltBot** - Conversational AI assistant
- **Custom Apps** - Add your own applications

## 🚀 Quick Start

### Local Development
```bash
# Clone the repository
git clone <your-repo-url>
cd api-dashboard

# Open in browser
# Simply open index.html in your browser
# No build process required!
```

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: API Command Center"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Other
     - **Build Command**: (leave empty)
     - **Output Directory**: `.` (root)
   - Click "Deploy"

3. **Set Custom Domain**
   - Go to Project Settings → Domains
   - Add custom domain: `api-command.mytestbed.tech`
   - Update DNS records as instructed

## 📖 Usage Guide

### Terminal Commands

| Command | Description | Example |
|---------|-------------|---------|
| `help` | Show all commands | `help` |
| `list apps` | Show AI applications | `list apps` |
| `list models` | Show available models | `list models` |
| `show config <app>` | Display app configuration | `show config openclaw` |
| `config <app> --primary <model> --fallback <model>` | Configure models | `config openclaw --primary gpt-4-turbo --fallback claude-3-sonnet` |
| `export <app>` | Export config as JSON | `export openclaw` |
| `clear` | Clear terminal | `clear` |

### Keyboard Shortcuts

- **Arrow Left/Right** - Navigate slides (Dashboard view)
- **Arrow Up** - Previous command (Terminal view)
- **Enter** - Execute command (Terminal view)

### Data Persistence

All configurations are stored in browser LocalStorage:
- AI application settings
- Command history
- Usage statistics

To reset: Clear browser data for the site.

## 🏗️ Architecture

### Tech Stack
- **HTML5** - Semantic structure
- **Vanilla CSS** - Pure black stage aesthetic with gradients
- **Vanilla JavaScript** - No frameworks, no dependencies
- **LocalStorage** - Client-side data persistence

### Design Philosophy
- **Minimalist** - Pure black background, high-contrast typography
- **Bold** - 96px headlines, dramatic spotlights
- **Revolutionary** - Cinematic reveals, typewriter effects
- **Responsive** - Works on all screen sizes

### File Structure
```
api-dashboard/
├── index.html          # Main HTML structure
├── styles.css          # Cinematic design system
├── app.js              # Application logic
├── vercel.json         # Deployment configuration
├── .gitignore          # Git exclusions
└── README.md           # This file
```

## 🎨 Customization

### Add New AI Application
Edit `app.js` and add to `getMockApps()`:
```javascript
{
    id: 'myapp',
    name: 'My App',
    description: 'My AI application',
    icon: 'MA',
    primaryModel: { provider: 'openai', model: 'gpt-4-turbo', costPer1k: 0.01 },
    fallbackModel: { provider: 'anthropic', model: 'claude-3-sonnet', costPer1k: 0.003 }
}
```

### Add New Model
Edit `app.js` and add to `MODELS`:
```javascript
'my-model': { provider: 'myprovider', name: 'My Model', costPer1k: 0.005 }
```

### Change Color Scheme
Edit `styles.css` root variables:
```css
:root {
    --accent-primary: #667eea;  /* Change to your color */
    --accent-secondary: #764ba2;
}
```

## 📱 Responsive Design

- **Desktop (1920px+)**: Full presentation mode with large typography
- **Laptop (1366px-1920px)**: Scaled presentation mode
- **Tablet (768px-1366px)**: Hybrid mode with adjusted layouts
- **Mobile (375px-768px)**: Simplified single-column layout

## 🔒 Security

- No external API calls (fully client-side)
- No sensitive data transmission
- LocalStorage only (user's browser)
- Security headers configured in `vercel.json`

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 🙏 Credits

Inspired by:
- **Steve Jobs** - Apple Keynote presentations
- **TEDx** - Bold stage design and storytelling
- **Terminal aesthetics** - Classic CRT green glow

---

**Built with ❤️ for the AI revolution**

*"Think Different"*
