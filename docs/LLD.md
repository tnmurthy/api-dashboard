# Low-Level Design (LLD)

## Class: `AuthService`

### Properties

| Property      | Type      | Storage        | Description                              |
|---------------|-----------|----------------|------------------------------------------|
| `MOCK_USERS`  | `User[]`  | In-memory only | Never persists to localStorage           |
| `SESSION_KEY` | `string`  | sessionStorage | Key: `'api_command_session'`             |

### User Model

```
{
  id:          string     // unique user ID
  name:        string     // full name
  email:       string     // login email
  password:    string     // plain text (mock only — never do this in production)
  role:        'admin' | 'user'
  avatar:      string     // initials, e.g. "AJ"
  department:  string     // e.g. "Engineering"
  status:      'active' | 'inactive'
  lastLogin:   string     // ISO timestamp
  apiCalls:    number     // total API calls made
  costMonth:   number     // $ spent this month
}
```

### Session Model

```
{
  userId:    string
  role:      'admin' | 'user'
  name:      string
  email:     string
  avatar:    string
  loginTime: string   // ISO timestamp
}
```

### Methods

| Method                  | Signature                   | Description                           |
|-------------------------|-----------------------------|---------------------------------------|
| `login`                 | `(email, password) → session \| null` | Validate credentials, create session |
| `logout`                | `() → void`                 | Clear sessionStorage                  |
| `getSession`            | `() → session \| null`      | Read from sessionStorage              |
| `isAdmin`               | `() → boolean`              | Shorthand role check                  |
| `getUsers`              | `() → User[]`               | Admin only; returns MOCK_USERS        |
| `addUser`               | `(data) → User`             | Append to MOCK_USERS                  |
| `updateUser`            | `(id, data) → User`         | Mutate user in MOCK_USERS             |
| `toggleUserStatus`      | `(id) → void`               | Toggle active ↔ inactive              |

---

## Class: `StorageService` — Additions

### New Storage Keys

| Key                   | Contents          |
|-----------------------|-------------------|
| `api_command_audit`   | `AuditEntry[]`    |

### Audit Entry Model

```
{
  id:          string
  timestamp:   string     // ISO
  userId:      string
  userName:    string
  userAvatar:  string     // initials
  action:      'login' | 'logout' | 'config_change' | 'contact_add' |
               'contact_delete' | 'billing' | 'user_add' | 'user_delete' |
               'settings_change'
  description: string
  ip:          string     // mock IP, e.g. "192.168.1.42"
  severity:    'info' | 'warning' | 'critical'
}
```

### New Methods

| Method            | Signature                     | Description                      |
|-------------------|-------------------------------|----------------------------------|
| `getMockAuditLog` | `() → AuditEntry[]`           | Returns 20+ pre-seeded entries   |
| `getAuditLog`     | `() → AuditEntry[]`           | Read from localStorage           |
| `saveAuditLog`    | `(log) → void`                | Write to localStorage            |
| `addAuditEntry`   | `(entry) → void`              | Prepend; keep last 500 entries   |

---

## AppController — New Constant

```javascript
const ROLE_CONFIG = {
  admin: {
    tabs: ['dashboard', 'analytics', 'users', 'crm', 'config', 'wallet', 'audit', 'settings']
  },
  user: {
    tabs: ['dashboard', 'config', 'crm', 'wallet', 'profile']
  }
};
```

## AppController — Lifecycle Change

```
init()
  → check sessionStorage for session
    → if none:    show login screen, stop
    → if present: showApp(session)

showApp(session)
  → hide login, show app
  → renderNav(session.role)
  → call all setup methods
  → addAuditEntry('login', ...)
  → navigateTo('dashboard')
```

## AppController — New Methods

| Method                   | Role Scope | Responsibility                                             |
|--------------------------|------------|------------------------------------------------------------|
| `setupLogin()`           | Pre-auth   | Spotlight mouse-track, form submit, demo quick-fill buttons|
| `showApp(session)`       | Post-auth  | Transition from login screen to app, render nav            |
| `renderNav(role)`        | Post-auth  | Populate `#nav-tabs` from ROLE_CONFIG, render user widget  |
| `setupLogout()`          | Post-auth  | `auth.logout()` → `location.reload()`                     |
| `navigateTo(viewId)`     | Post-auth  | Show correct view div, highlight active tab                |
| `setupAdminAnalytics()`  | Admin      | CSS bar charts for provider/model/daily usage; top-users   |
| `setupAdminUsers()`      | Admin      | Users table, Add/Edit modal, search/role filter            |
| `openUserModal(id)`      | Admin      | Populate or clear user add/edit form                       |
| `saveUserModal()`        | Admin      | Validate, call `auth.addUser/updateUser`, reload table     |
| `setupAdminAudit()`      | Admin      | Render audit entries, wire filters, export CSV             |
| `setupAdminSettings()`   | Admin      | 4-section settings form, per-section save                  |
| `setupUserProfile()`     | User       | Profile header, personal info, API keys, notifications     |
| `generateApiKey()`       | User       | Create `sk-` + 32-char hex, add to profile key list       |
| `revokeApiKey(keyId)`    | User       | Set key status to `revoked`, re-render row                 |
| `addAuditEntry(action, desc)` | All   | Prepend audit entry; called by all significant actions     |

## Where `addAuditEntry()` is Called

| Trigger                  | Action Token        |
|--------------------------|---------------------|
| Successful login         | `login`             |
| `applyConfig()`          | `config_change`     |
| `addContact()`           | `contact_add`       |
| `deleteContact()`        | `contact_delete`    |
| `processTopup()`         | `billing`           |
| `saveUserModal()`        | `user_add` / `user_delete` |
| Settings section save    | `settings_change`   |

---

## Updated Contact Model

The `owner` field is added for CRM role-scoping:

```
{
  id:            string
  name:          string
  company:       string
  email:         string
  phone:         string
  title:         string
  status:        'lead' | 'prospect' | 'customer' | 'churned'
  priority:      'hot' | 'warm' | 'cold'
  value:         number     // deal value in $
  owner:         string     // account owner name — used for user-role filtering
  tags:          string[]
  notes:         Note[]
  tasks:         Task[]
  lastContacted: string     // ISO date
  createdAt:     string     // ISO timestamp
}
```

**Filtering rule:**
- `role === 'admin'` → `getContacts()` returns all contacts
- `role === 'user'`  → `getContacts()` returns only contacts where `owner === session.name` or `owner` is empty

---

## View Specifications

### Admin: Analytics View

1. **KPI Row** (4 cards): Org API Calls · Total Tokens · Total Cost This Month · Active Users
2. **Provider Usage** — horizontal CSS bar chart: OpenAI / Anthropic / Google / Azure (widths = % of calls)
3. **Daily API Calls Last 7 Days** — vertical CSS bar chart (7 columns, heights proportional to call count)
4. **Cost by Model** — horizontal CSS bar chart: GPT-4 / Claude 3 Opus / Gemini Pro / etc.
5. **Top Users Table** — avatar · name · dept · api calls · cost this month · last active

All charts are pure CSS `<div>` elements — no canvas, no SVG, no external libraries.

### Admin: User Management View

- **Toolbar:** Search input + Role filter (All / Admin / User) + "Add User" button
- **Table columns:** ☐ · Avatar · Name · Email · Role badge · Status badge · Department · Last Login · API Calls · Actions
- **Actions per row:** Edit · Suspend · Delete
- **Modal fields:** Full Name · Email · Temp Password · Role · Department · Status
- **Behaviors:** Suspend toggles `active ↔ inactive`; Delete removes from MOCK_USERS (in-memory); both log audit entries

### Admin: Audit Log View

- **Toolbar:** Search (by user/action) + Action Type filter + Date filter + Export CSV
- **Row:** Timestamp · User avatar+name · Action badge (color-coded) · Description · Mock IP

**Action badge colors:**

| Action             | Color  |
|--------------------|--------|
| `login`            | Blue   |
| `config_change`    | Purple |
| `contact_add/delete` | Teal |
| `billing`          | Green  |
| `user_add/delete`  | Orange |
| `settings_change`  | Yellow |
| `critical`         | Red    |

Pre-seeded with 20+ realistic entries covering all action types.

### Admin: System Settings View

**Section 1 — Rate Limits**
- Per-user daily token limit (number)
- Monthly org cost alert threshold ($)
- Hard limit enforcement (toggle)

**Section 2 — Billing**
- Billing contact email
- Invoice period (Monthly / Quarterly)
- Cost center / department code
- Spend alert at % of budget

**Section 3 — Security**
- Session timeout (15 min / 30 min / 1 hr / 8 hr)
- Enforce 2FA for all users (toggle)
- IP allowlist (textarea, one per line)

**Section 4 — Integrations**
- Slack webhook URL
- Email notifications on critical errors (toggle)
- Webhook signing secret (masked, with reveal toggle)

Each section has its own **Save Changes** button. Changes persisted to localStorage under `api_command_system_settings`.

### User: My Profile View

**Header:** 80px avatar circle (initials) · Full name · Email · Role badge · Member since · Department

**Section 1 — Personal Info:** Name · Email · Phone · Timezone (select)

**Section 2 — API Key Management**
- Table: Key Name · Created · Last Used · Status · [Copy] [Revoke]
- 2 sample keys pre-seeded (one active, one inactive)
- "Generate New Key" → `sk-` + 32-char random hex, added to table
- Revoke → status = `revoked`, row greyed with strikethrough

**Section 3 — Notification Preferences**
- Usage alert at 80% of daily limit (toggle)
- Billing alert when monthly budget hit (toggle)
- Weekly usage summary email (toggle)
- Notify on API errors (toggle)

**Section 4 — My Usage Limits**
- Daily token limit (read-only, set by admin)
- Monthly budget ($, user-editable)
- Alert at % of monthly budget (slider 50–100%)
- Progress bars: current month usage vs limits

---

## Component Inventory

| Component                          | File       | Role Scope | Description                          |
|------------------------------------|------------|------------|--------------------------------------|
| `AuthService`                      | app.js     | All        | Login, session, mock users           |
| `StorageService`                   | app.js     | All        | localStorage CRUD + audit log        |
| `ROLE_CONFIG`                      | app.js     | All        | Tab definitions per role             |
| `AppController.setupLogin()`       | app.js     | Pre-auth   | Login screen init                    |
| `AppController.renderNav()`        | app.js     | Post-auth  | Dynamic tab rendering                |
| `AppController.setupAdminAnalytics()` | app.js  | Admin      | CSS charts, top-users table          |
| `AppController.setupAdminUsers()`  | app.js     | Admin      | User CRUD, modal                     |
| `AppController.setupAdminAudit()`  | app.js     | Admin      | Audit log, filters, export           |
| `AppController.setupAdminSettings()` | app.js   | Admin      | 4-section settings                   |
| `AppController.setupUserProfile()` | app.js     | User       | Profile, API keys, notifications     |
| `view-login`                       | index.html | Pre-auth   | Login screen HTML                    |
| `view-analytics`                   | index.html | Admin      | Analytics HTML shell                 |
| `view-users`                       | index.html | Admin      | Users table + modal HTML             |
| `view-audit`                       | index.html | Admin      | Audit log HTML shell                 |
| `view-settings`                    | index.html | Admin      | Settings panels HTML                 |
| `view-profile`                     | index.html | User       | Profile HTML                         |
| Login screen styles                | styles.css | —          | Glass card, demo buttons             |
| Analytics styles                   | styles.css | —          | CSS bar charts                       |
| Users styles                       | styles.css | —          | Table, avatar, badges                |
| Audit styles                       | styles.css | —          | Action badges, log entries           |
| Settings styles                    | styles.css | —          | Section panels                       |
| Profile styles                     | styles.css | —          | Profile header, key table            |
