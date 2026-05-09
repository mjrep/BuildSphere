# BuildSphere: Technical Context Injection (Mobile)
**System Version**: Phase 2 Verified (May 2026)
**Target Platform**: Expo / React Native
**Purpose**: Injecting backend constraints and business logic for AI-assisted mobile development.

---

## 🏗️ 1. System Architecture State
BuildSphere has transitioned from a standard CRUD architecture to a **Reactive Ledger System**.
- **Backend**: Node.js / Express.js (Stateful Middleware, RBAC Controllers).
- **Database**: Supabase / PostgreSQL.
- **Data Paradigm**: Immutability for financial and material data. State changes are driven by `logs` or `transactions`.
- **Reactivity**: Supabase Realtime (Postgres Changes) is the primary driver for UI updates (Notifications/Stock).

---

## 📦 2. Inventory Ledger API Contract
Direct updates to `current_stock` in `project_inventory_items` are strictly prohibited. All stock modifications must go through the transaction ledger.

### Database Trigger Change (CRITICAL)
The trigger `trg_update_inventory_stock` has been updated to **BEFORE INSERT**.
- It now automatically calculates the running balance and populates the `current_stock` field in the `project_inventory_logs` record itself.
- **Mobile Action**: When displaying history, include the `current_stock` column to show the running balance after each transaction.

### Transaction Logic Updates
1. **Remove ADJUSTMENT**: The `ADJUSTMENT` action type is deprecated and removed from the UI. Only `RECEIVING`, `CONSUMPTION`, and `SPOILAGE` are supported.
2. **Mandatory Confirmation**: Mobile UI must implement a two-step confirmation process for logging transactions.
3. **Irreversibility Warning**: Explicitly display a warning: *"This transaction is irreversible once logged. Ensure all data is accurate before finalizing."*

### Endpoint: `PATCH /api/projects/:projectId/inventory/:itemId/stock`
**Required Payload (JSON)**:
```json
{
  "action_type": "RECEIVING" | "CONSUMPTION" | "SPOILAGE",
  "quantity": number, // Must be > 0.
  "reference_task_id": "UUID", // REQUIRED if action_type === 'CONSUMPTION'
  "notes": "string"
}
```

---

## 🔔 3. Notification Realtime Specs
Real-time alerts use Supabase Postgres Changes on the `notifications` table.

### Subscription Configuration
- **Table**: `notifications`
- **Filter**: `user_id=eq.{current_user_id}`
- **Legacy Compatibility**: The backend populates `date` (`YYYY-MM-DD`) and `time` (`HH:mm AM/PM`) as strings to support existing mobile UI components.
- **Deep Linking**: Use the `reference_url` field (e.g., `/tasks/{uuid}`) to determine the navigation target within the mobile app.

---

## 🔑 4. Global Constants (Enums)
To ensure parity with the Express backend, use the following exact strings:

- **Action Types**: `RECEIVING`, `CONSUMPTION`, `SPOILAGE`. (Note: `ADJUSTMENT` is removed).
- **Project Status**: `proposed`, `active`, `completed`.
- **Task Status**: `todo`, `in_progress`, `in_review`, `completed`.
- **User Roles**: `CEO`, `COO`, `Project Engineer`, `Project Coordinator`, `Foreman`, `Procurement`, `Accounting`.

---

## 🤖 Developer AI Instruction (Mobile Update)
> **IMPORTANT**: The inventory system has been tightened.
> 1. **DO NOT** use `ADJUSTMENT` action types.
> 2. **DO** add a "Current Stock" column to all inventory history lists (ledger).
> 3. **DO** implement a confirmation modal/stage before calling the stock update API.
> 4. **DO** show a transaction summary and the "irreversible" warning in the confirmation stage.
> 5. **DO** remove status prefixes (like `[todo]`) from task selection labels in the inventory modal.
