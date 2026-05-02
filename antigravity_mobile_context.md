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

## 📊 2. Progress Logic (The Source of Truth)
Mobile implementations must adhere to the following mathematical constraints for progress rollups:

### Progress Formulas
1. **Milestone Progress ($P_{ms}$)**:
   For milestones with both quantities and tasks:
   $$P_{ms} = \frac{\left( \frac{Q_{current}}{Q_{target}} \times 100 \right) + \text{avg}(T_{completion})}{2}$$
   *Where $Q$ is quantity and $T$ is task completion percentage.*

2. **Phase Progress ($P_{phase}$)**:
   $$P_{phase} = \sum (P_{ms} \times W_{ms})$$
   *Where $W_{ms}$ is the milestone's `weight_percentage` within the phase.*

### Strict Weighting Rule
- **Normalization**: The sum of all $W_{ms}$ within a single Phase **MUST exactly equal 100%**.
- **Enforcement**: Mobile UI must prevent submission if the total weight of child milestones $\neq 100\%$.

---

## 📦 3. Inventory Ledger API Contract
Direct updates to `current_stock` are strictly prohibited. All stock modifications must go through the transaction ledger.

### Endpoint: `POST /api/projects/:projectId/inventory/:itemId/transaction`
**Required Payload (JSON)**:
```json
{
  "action_type": "RECEIVING" | "CONSUMPTION" | "SPOILAGE" | "ADJUSTMENT",
  "quantity": number, // Must be > 0. Trigger handles the sign.
  "reference_task_id": "UUID", // REQUIRED if action_type === 'CONSUMPTION'
  "notes": "string"
}
```
**Constraint**: The database trigger `trg_update_inventory_stock` automatically updates `project_inventory_items.current_stock` based on the `action_type`.

---

## 🔔 4. Notification Realtime Specs
Real-time alerts use Supabase Postgres Changes on the `notifications` table.

### Subscription Configuration
- **Table**: `notifications`
- **Filter**: `user_id=eq.{current_user_id}`
- **Legacy Compatibility**: The backend populates `date` (`YYYY-MM-DD`) and `time` (`HH:mm AM/PM`) as strings to support existing mobile UI components.
- **Deep Linking**: Use the `reference_url` field (e.g., `/tasks/{uuid}`) to determine the navigation target within the mobile app.

---

## 🔑 5. Global Constants (Enums)
To ensure parity with the Express backend, use the following exact strings:

- **Action Types**: `RECEIVING`, `CONSUMPTION`, `SPOILAGE`, `ADJUSTMENT`.
- **Project Status**: `proposed`, `active`, `completed`.
- **Task Status**: `todo`, `in_progress`, `in_review`, `completed`.
- **User Roles**: `CEO`, `COO`, `Project Engineer`, `Project Coordinator`, `Foreman`, `Procurement`, `Accounting`.

---

## 🤖 Developer AI Instruction
> **IMPORTANT**: Use the data above as the primary technical constraint for all implementation suggestions.
> 1. **DO NOT** suggest direct stock updates to `current_stock`.
> 2. **DO NOT** suggest unweighted progress averages for phases.
> 3. **DO NOT** use native WebSockets; always use `supabase.channel()` for realtime.
> 4. **DO** enforce task-linking for all material consumption.
