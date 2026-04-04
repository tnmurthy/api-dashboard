# Process Flow Diagrams

## 1. Authentication & Role Resolution

```
START
  │
  ▼
Load app.js
  │
  ▼
Check sessionStorage for 'api_command_session'
  │
  ├─ Session found? ──YES──▶ Validate: loginTime + timeout threshold
  │                                │
  │                          ├─ Valid? ──▶ showApp(session)
  │                          └─ Expired? ─▶ auth.logout() → show login
  │
  └─ No session ──▶ Show Login Screen (#view-login)
                         │
                   User enters email + password
                   (or clicks demo account button)
                         │
                   AuthService.login(email, password)
                         │
                   ├─ Match found? ──NO──▶ Show error "Invalid credentials"
                   │                              │
                   │                         (loop back to form)
                   │
                   └─ YES
                         │
                   Create session object { userId, role, name, email, avatar, loginTime }
                   Store in sessionStorage
                         │
                   role === 'admin'?
                         │
                   ├─ YES ──▶ renderNav('admin') → 8 tabs
                   │          [Dashboard, Analytics, Users, CRM, Configure, Wallet, Audit, Settings]
                   │
                   └─ NO  ──▶ renderNav('user') → 5 tabs
                              [Dashboard, My Apps, My CRM, Wallet, Profile]
                         │
                   addAuditEntry('login', 'User logged in')
                         │
                   navigateTo('dashboard')
                         │
                        END
```

---

## 2. CRM Contact Lifecycle (State Machine)

```
States:  [Lead] ──▶ [Prospect] ──▶ [Customer]
           │             │               │
           └─────────────┴───────────────▶ [Churned]
                                               │
                                          (re-engagement)
                                               │
                                               ▼
                                           [Prospect]

Transitions:
  Lead      → Prospect  : Qualified (manual status change in table or modal)
  Prospect  → Customer  : Deal Closed Won
  Prospect  → Churned   : Deal Lost / No response
  Customer  → Churned   : Cancellation
  Churned   → Prospect  : Re-engagement campaign
  Any       → Deleted   : Delete button (irreversible, logs audit entry)

Role visibility:
  Admin: can see and modify all contacts
  User:  can only see contacts where owner === session.name (or owner is empty)
```

---

## 3. Admin Settings Save Process

```
Admin edits field(s) in any Settings section
  │
  ▼
Click "Save Changes" (each section has its own button)
  │
  ▼
Client-side validation
  ├─ Email format check (Billing section)
  ├─ Numeric range check (Rate Limits section)
  ├─ Required field check
  │
  ├─ INVALID ──▶ Show inline field error message
  │                     │
  │              (user corrects and retries)
  │
  └─ VALID
       │
       ▼
Read existing settings from localStorage ('api_command_system_settings')
       │
       ▼
Deep-merge section data into existing settings object
       │
       ▼
localStorage.setItem('api_command_system_settings', JSON.stringify(merged))
       │
       ▼
addAuditEntry('settings_change', '<SectionName> settings updated')
       │
       ▼
Button text → "✓ Saved" for 2 seconds, then reverts
       │
      END
```

---

## 4. User API Key Management

```
── GENERATE ──────────────────────────────────────────────

User clicks "Generate New Key"
  │
  ▼
Generate value: "sk-" + crypto.getRandomValues() → 32-char hex string
  │
  ▼
Build key object:
  { id: uuid, name: "New Key", value: "sk-...", created: now, lastUsed: null, status: 'active' }
  │
  ▼
Append to profile.apiKeys[] in localStorage
  │
  ▼
Render new row in keys table
  • Value column shows blurred/masked text by default
  • [Copy] and [Revoke] action buttons visible
  │
  ▼
END

── COPY ──────────────────────────────────────────────────

User clicks [Copy] on a key row
  │
  ▼
navigator.clipboard.writeText(key.value)
  │
  ▼
Button text → "Copied!" tooltip for 2 seconds
  │
END

── REVOKE ────────────────────────────────────────────────

User clicks [Revoke] on an active key row
  │
  ▼
Show confirm dialog: "Revoke this key? This cannot be undone."
  │
  ├─ Cancel ──▶ Nothing happens
  │
  └─ Confirm
       │
       ▼
Set key.status = 'revoked' in profile.apiKeys[]
       │
       ▼
Save updated profile to localStorage
       │
       ▼
Re-render row: grey text, strikethrough on value, [Revoke] button disabled
       │
      END
```

---

## 5. CRM Bulk Operation Flow

```
User selects one or more contact rows (checkboxes)
  │
  ▼
Bulk action bar appears (slides in from top of table)
  Shows: "N selected" · Status dropdown · Apply · Delete Selected · Deselect All
  │
  ├─ STATUS CHANGE ──────────────────────────────
  │   User picks new status from dropdown
  │   User clicks "Apply"
  │   │
  │   ▼
  │   For each selected contact ID:
  │     contacts[id].status = newStatus
  │   │
  │   ▼
  │   saveContacts(updated list)
  │   addAuditEntry('contact', 'Bulk status change: N contacts → <status>')
  │   loadCRMStats()
  │   Re-render table (deselect all)
  │
  └─ BULK DELETE ────────────────────────────────
      User clicks "Delete Selected"
      │
      ▼
      Confirm dialog: "Delete N contacts? This cannot be undone."
      │
      ├─ Cancel ──▶ Nothing
      │
      └─ Confirm
           │
           ▼
           Remove selected IDs from contacts array
           saveContacts(updated list)
           addAuditEntry('contact_delete', 'Bulk delete: N contacts removed')
           loadCRMStats()
           Re-render table
```

---

## 6. Wallet Top-Up Flow

```
User arrives at Wallet view
  │
  ▼
loadWalletData() → render balance, transactions, auto-refill toggle
  │
  ├─ PACKAGE SELECTION ──────────────────────────
  │   User clicks a preset package button ($10 / $25 / $50 / $100)
  │   Selected package gets 'active' highlight class
  │   Custom amount input is cleared
  │
  └─ CUSTOM AMOUNT ──────────────────────────────
      User types in custom amount input
      Package selection is cleared

User clicks "Add Credits"
  │
  ▼
Validate: amount > 0 and amount <= 10000
  │
  ├─ Invalid ──▶ Show error, stop
  │
  └─ Valid
       │
       ▼
Calculate tokens: amount * 100,000 tokens per $1
       │
       ▼
wallet.balance += amount
wallet.monthlySpend += amount
wallet.totalSpent += amount
wallet.tokensRemaining += tokens
       │
       ▼
saveWallet(updated wallet)
addTransaction({ id, date: now, description: 'Credits Added', tokens: +tokens, amount: +amount, type: 'credit' })
addAuditEntry('billing', `Wallet top-up: +$${amount}`)
       │
       ▼
loadWalletData() → UI reflects new balance
       │
      END
```
