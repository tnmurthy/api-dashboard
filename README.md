# API Command Center

> **"One more thing..."** - A revolutionary way to manage your AI infrastructure.

A cinematic, role-based SPA dashboard for managing AI APIs — featuring an **Admin Panel**, **User Panel**, CRM, Wallet, Audit Log, and System Settings. Powered by vanilla HTML/CSS/JS with zero dependencies.

![API Command Center](https://img.shields.io/badge/Status-Production-success)
![Version](https://img.shields.io/badge/Version-3.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 🔐 Role-Based Access Control
Two roles with distinct views and permissions:

| View / Feature   | Admin                | User               |
|------------------|----------------------|--------------------|
| Dashboard        | ✅ Org-wide stats    | ✅ Personal stats  |
| Analytics        | ✅ Full CSS charts   | ❌ Hidden          |
| User Management  | ✅ Full CRUD         | ❌ Hidden          |
| CRM              | ✅ All contacts      | 🔒 Own contacts    |
| Configure        | ✅ All apps          | ✅ Own apps        |
| Billing / Wallet | ✅ Org billing       | ✅ Personal wallet |
| Audit Log        | ✅ Full              | ❌ Hidden          |
| System Settings  | ✅ Full              | ❌ Hidden          |
| My Profile       | ❌ Hidden            | ✅ Full            |

### 🎭 Dashboard
- Animated KPI stat cards (API calls, tokens, cost, success rate)
- Live activity log with CSV export
- Role-aware: org-wide for admins, personal for users

### 💻 Command Terminal
Configure AI applications via CLI:
```bash
$ config openclaw --primary gpt-4-turbo --fallback claude-3-sonnet
✓ OpenClaw configured

$ list models
  • gpt-4-turbo      ($0.01/1k)  [OpenAI]
  • claude-3-opus    ($0.015/1k) [Anthropic]
  • gemini-pro       ($0.0005/1k)[Google]
```

### 📊 Admin: Analytics
- CSS-only bar charts (no canvas, no SVG, no libraries)
- Provider usage, daily API calls (7-day), cost by model
- Top users table with avatar, dept, API calls, cost

### 👥 Admin: User Management
- Search + role-filter table with status badges
- Add/Edit modal with full user form
- Suspend / Delete with audit trail

### 📋 Admin: Audit Log
- Color-coded action badges (login, config, billing, CRM, settings, critical)
- Search + action type + date filters
- Export to CSV
- 20+ pre-seeded realistic entries

### ⚙️ Admin: System Settings
- **Rate Limits** — per-user token limits, cost alerts, hard limit toggle
- **Billing** — contact email, invoice period, cost center, spend alert %
- **Security** — session timeout, 2FA toggle, IP allowlist
- **Integrations** — Slack webhook, email notifications, signing secret

### 📇 CRM
- Enriched contact model: phone, title, priority (hot/warm/cold), owner, tags, notes, tasks
- Table view: sortable columns, search, status filters, bulk actions, pagination
- Kanban pipeline view: Lead → Prospect → Customer → Churned
- CSV import / export

### 💳 Wallet
- Balance cards, top-up packages ($10 / $25 / $50 / $100), custom amount
- Auto-refill toggle, transaction history, CSV export

### 👤 User: My Profile
- Profile header with avatar, role badge, member since
- Personal info form, timezone select
- API key management (generate `sk-...` keys, copy, revoke)
- Notification preferences toggles
- Usage limits with progress bars

---

## 🚀 Quick Start

```bash
# No build step — just open in browser
open index.html
```

### Deploy to Vercel
1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com) → Framework: **Other**, Output: `.`
3. Deploy

---

## 📖 Usage

### Demo Accounts (mock — no real auth)

| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| Admin | admin@apicommand.io   | admin123  |
| User  | user@apicommand.io    | user123   |

Session is stored in `sessionStorage` and cleared when the tab closes.

### Terminal Commands

| Command | Description |
|---------|-------------|
| `help` | Show all commands |
| `list apps` | Show AI applications |
| `list models` | Show available models with pricing |
| `show config <app>` | Display app configuration |
| `config <app> --primary <model> --fallback <model>` | Configure models |
| `export <app>` | Export config as JSON |
| `clear` | Clear terminal |

---

## 🏗️ Architecture

### Tech Stack

| Layer       | Technology              | Notes                              |
|-------------|-------------------------|------------------------------------|
| UI          | Vanilla HTML / CSS / JS | No frameworks, no build step       |
| Charts      | Pure CSS `<div>`        | No canvas, no SVG, no libraries    |
| Auth        | In-memory + sessionStorage | Mock credentials, role-gating   |
| Persistence | localStorage            | Contacts, wallet, apps, audit log  |
| Deployment  | Vercel                  | Static site, zero config           |

### File Structure

```
api-dashboard/
├── index.html              # Full SPA — all views (login, dashboard, CRM, wallet, …)
├── styles.css              # Design system — dark theme, glassmorphism, CSS charts
├── app.js                  # All logic — AuthService, StorageService, AppController
├── vercel.json             # Deployment + security headers
├── README.md               # This file
└── docs/
    ├── HLD.md              # System architecture, RBAC table, auth flow, design decisions
    ├── LLD.md              # Class specs, data models, method tables, view specs
    ├── SEQUENCE_DIAGRAMS.md # 8 interaction flows (login, CRM, wallet, settings, …)
    └── PROCESS_DIAGRAMS.md  # 6 process flows & state machines
```

### Key Design Decisions

1. **No routing library** — view switching is show/hide of `<div class="view">` elements
2. **No real auth** — `sessionStorage` holds the role; cleared on tab close; mock credentials are in-memory only
3. **CSS-only charts** — bar charts are `<div>` elements with percentage widths and gradient fills
4. **Audit log** — append-only in localStorage, max 500 entries, never editable from UI
5. **CRM ownership** — `owner` field on contacts; user role filters on `owner === session.name`
6. **Settings persistence** — system settings use a separate localStorage key from per-user data

---

## 📐 Design Docs

Full architecture and design docs live in [`docs/`](./docs/):

| Document | Contents |
|----------|----------|
| [`docs/HLD.md`](./docs/HLD.md) | System architecture diagram, RBAC table, auth flow, tech stack |
| [`docs/LLD.md`](./docs/LLD.md) | `AuthService`, `StorageService`, `AppController` specs; all data models; view specs |
| [`docs/SEQUENCE_DIAGRAMS.md`](./docs/SEQUENCE_DIAGRAMS.md) | 8 sequence diagrams: admin login, user login, add user, wallet top-up, CRM bulk ops, revoke key, audit log, settings save |
| [`docs/PROCESS_DIAGRAMS.md`](./docs/PROCESS_DIAGRAMS.md) | 6 process flows: auth resolution, CRM lifecycle state machine, settings save, API key management, bulk CRM ops, wallet top-up |

---

## 🎨 Customization

### Add a New AI Application
In `app.js`, add to `getMockApps()`:
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

### Add a New Model
In `app.js`, add to `MODELS`:
```javascript
'my-model': { provider: 'myprovider', name: 'My Model', costPer1k: 0.005 }
```

### Change Color Scheme
In `styles.css`:
```css
:root {
    --accent-primary: #667eea;
    --accent-secondary: #764ba2;
}
```

---

## 📱 Responsive Design

| Breakpoint | Behaviour |
|------------|-----------|
| 1920px+    | Full layout, large KPI cards |
| 1366–1920px | Scaled layout |
| 768–1366px | Tablet: adjusted column counts |
| 375–768px  | Mobile: single-column |

---

## 🔒 Security Notes

- No external API calls — fully client-side
- No sensitive data transmitted
- Mock credentials are in-memory only and never written to localStorage
- sessionStorage session is cleared on tab close
- Security headers configured in `vercel.json`
- ⚠️ Role-gating is UI-only — suitable for a demo; real deployments require server-side enforcement

---

## 📄 License

MIT License — free for personal or commercial use.

---

**Built with ❤️ for the AI revolution**
