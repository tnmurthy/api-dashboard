# High-Level Design (HLD)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                            │
│                                                                 │
│  ┌──────────────┐   ┌─────────────────────────────────────┐    │
│  │  Login Screen │──▶│           App Shell                 │    │
│  │  (role select)│   │  ┌──────────────────────────────┐  │    │
│  └──────────────┘   │  │     Role-Based Navigation    │  │    │
│                     │  │  Admin: 8 tabs | User: 5 tabs│  │    │
│                     │  └──────────────────────────────┘  │    │
│                     │  ┌──────────────────────────────┐  │    │
│                     │  │        View Router           │  │    │
│                     │  └──────────────────────────────┘  │    │
│                     │  ┌─────────────┐ ┌──────────────┐  │    │
│                     │  │ Admin Views │ │  User Views  │  │    │
│                     │  └─────────────┘ └──────────────┘  │    │
│                     └─────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────┐   ┌──────────────────────────────┐     │
│  │  sessionStorage    │   │       localStorage           │     │
│  │  (current session) │   │  (contacts, wallet, apps,    │     │
│  └────────────────────┘   │   activity, audit log, etc.) │     │
│                           └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Role-Based Access Control (RBAC)

| View / Feature   | Admin                | User               |
|------------------|----------------------|--------------------|
| Dashboard        | ✅ Org-wide stats    | ✅ Personal stats  |
| Analytics        | ✅ Full              | ❌ Hidden          |
| User Management  | ✅ Full CRUD         | ❌ Hidden          |
| CRM              | ✅ All contacts      | 🔒 Own contacts    |
| Configure        | ✅ All apps          | ✅ Own apps        |
| Billing / Wallet | ✅ Org billing       | ✅ Personal wallet |
| Audit Log        | ✅ Full              | ❌ Hidden          |
| System Settings  | ✅ Full              | ❌ Hidden          |
| My Profile       | ❌ Hidden            | ✅ Full            |

## Auth Flow (mock, client-side)

- Session stored in `sessionStorage` (cleared on tab close)
- Credentials validated against in-memory mock user list
- Role determines which tabs and views are rendered
- No real tokens or JWTs — purely role-based UI gating

## Tech Stack

| Layer       | Technology         | Notes                              |
|-------------|--------------------|------------------------------------|
| UI          | Vanilla HTML/CSS/JS | No frameworks, no build step      |
| Charts      | Pure CSS `<div>`   | No canvas, no SVG, no libraries    |
| Auth        | In-memory + sessionStorage | Mock credentials, role-gating |
| Persistence | localStorage       | Contacts, wallet, apps, audit log  |
| Deployment  | Vercel             | Static site, zero config           |

## Key Design Decisions

1. **No routing library** — view switching is show/hide of `<div class="view">` elements
2. **No real auth** — `sessionStorage` holds the role; cleared when browser tab closes
3. **CSS-only charts** — bar charts are `<div>` elements with percentage widths and gradient fills
4. **Audit log** is append-only in localStorage (max 500 entries); never editable from UI
5. **Role-gating** is UI-only — appropriate for a client-side demo; real deployments need server-side enforcement
6. **CRM ownership** — contacts have an `owner` field; user panel filters on `owner === session.name`
7. **Settings persistence** — system settings use their own localStorage key separate from per-user settings
