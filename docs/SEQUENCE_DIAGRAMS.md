# Sequence Diagrams

## 1. Admin Login Flow

```
User          LoginScreen       AuthService       AppController
 │                │                  │                  │
 │──click demo──▶│                  │                  │
 │               │──login(email,pw)─▶│                  │
 │               │                  │──validate──────▶ │
 │               │                  │◀─session obj──── │
 │               │◀─session─────────│                  │
 │               │──────────────────────showApp(sess)──▶│
 │               │                  │                  │──renderNav('admin')
 │               │                  │                  │──setupAdminAnalytics()
 │               │                  │                  │──setupAdminUsers()
 │               │                  │                  │──setupAdminAudit()
 │               │                  │                  │──setupAdminSettings()
 │               │                  │                  │──addAuditEntry('login')
 │               │                  │                  │──navigateTo('dashboard')
```

---

## 2. Regular User Login Flow

```
User          LoginScreen       AuthService       AppController
 │──sign in───▶│                  │                  │
 │             │──login(e,p)──────▶│                  │
 │             │◀─session(role=user)│                 │
 │             │──────────────────────showApp(sess)──▶│
 │             │                  │                  │──renderNav('user') [5 tabs]
 │             │                  │                  │──setupCRM() [own contacts only]
 │             │                  │                  │──setupUserProfile()
 │             │                  │                  │──addAuditEntry('login')
 │             │                  │                  │──navigateTo('dashboard')
```

---

## 3. Admin Adds a User

```
Admin        UsersView        UserModal       AuthService    StorageService
  │──Add User──▶│                 │               │               │
  │             │──openModal()───▶│               │               │
  │             │                 │ (blank form)  │               │
  │──fill form──▶                 │               │               │
  │──click Save──────────────────▶│               │               │
  │             │                 │──validate()   │               │
  │             │                 │──addUser(data)─▶│             │
  │             │                 │               │ appends user  │
  │             │                 │──addAuditEntry('user_add')────▶│
  │             │◀──reloadTable()─│               │               │
  │◀──new row───│                 │               │               │
```

---

## 4. User Tops Up Wallet

```
User         WalletView      StorageService     AuditService
  │──select $25──▶│               │                  │
  │               │ highlight pkg  │                  │
  │──Add Credits──▶│               │                  │
  │               │──processTopup(25)                 │
  │               │──saveWallet(updated balance)──────▶│
  │               │──addTransaction({credit,+$25})────▶│
  │               │──addAuditEntry('billing', '+$25')──▶│
  │               │──loadWalletData()                  │
  │◀─updated UI───│               │                  │
```

---

## 5. CRM Bulk Status Change (Admin)

```
Admin        CRMView         StorageService     AuditService
  │──select 3 rows──▶│             │                │
  │                  │ show bulk bar│               │
  │──pick "Prospect"──▶│            │               │
  │──click Apply──────▶│            │               │
  │                  │──get contacts from storage──▶│
  │                  │──update status for selected IDs
  │                  │──saveContacts(updated)───────▶│
  │                  │──addAuditEntry('contact',...)──▶│
  │                  │──loadCRMStats()                │
  │◀──table re-renders│             │               │
```

---

## 6. User Revokes API Key

```
User         ProfileView     StorageService
  │──click Revoke──▶│              │
  │                 │──confirm()   │
  │◀──dialog────────│              │
  │──confirm────────▶│             │
  │                 │──setKeyStatus('revoked')
  │                 │──saveProfile(updated)───▶│
  │                 │──renderKeyTable()         │
  │◀──row greyed────│              │
```

---

## 7. Admin Views Audit Log

```
Admin        AuditView       StorageService
  │──click Audit tab──▶│          │
  │                    │──getAuditLog()──▶│
  │                    │◀─entries[]───────│
  │                    │──renderEntries() │
  │◀──log rows─────────│          │
  │──type search query──▶│         │
  │                    │──filterEntries(query)
  │◀──filtered rows────│          │
  │──click Export CSV──▶│         │
  │                    │──buildCSV(entries)
  │◀──file download────│          │
```

---

## 8. Admin Saves System Settings

```
Admin        SettingsView    StorageService    AuditService
  │──edit fields──▶│              │                │
  │──click Save────▶│              │                │
  │                │──validate()  │                │
  │                │──mergeSettings(existing, new)  │
  │                │──saveSettings(merged)──▶│      │
  │                │──addAuditEntry('settings_change')──▶│
  │◀──"✓ Saved"────│              │                │
```
