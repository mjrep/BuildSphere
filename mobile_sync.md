# BuildSphere Mobile Synchronization Guide
**Date**: May 2026
**Target Audience**: Expo / React Native Developers

This document outlines the architectural shifts and API requirements for the BuildSphere Mobile application to ensure synchronization with the recently modernized Express.js backend and Supabase ledger system.

---

## 🏗️ 1. Core Architecture Update: Reactive & Ledger-Based
The system has moved away from simple CRUD (Create, Read, Update, Delete) for critical data. We now use a **Ledger-Based** approach for inventory and **Supabase Realtime** for instant UI reactivity.

- **Immutability**: Inventory levels and progress logs should no longer be updated directly. Instead, a "Transaction" or "Log" is posted, and the system recalculates the state via database triggers.
- **Realtime**: The mobile app should utilize Supabase's `channel().on('postgres_changes', ...)` listeners rather than frequent polling for notifications and stock updates.

---

## 📊 2. Hybrid Progress & Weighting Logic
The mobile app must implement or reflect the following mathematical rules for progress reporting:

### Mathematical Formulas
1.  **Milestone Progress (`ms%`)**: 
    - `IF milestone.has_quantity`: `ms% = (current_quantity / target_quantity) * 50 + (task_completion_avg) * 50`
    - *Simplified*: It is the average of physical quantity progress and task completion status.
2.  **Phase Progress**: The weighted average of child milestones.
3.  **Project Progress**: The weighted average of child phases.

### Strict Validation Rule
- **Weighting Constraint**: Within any single Phase, the sum of all its child Milestone `weight_percentage` values **MUST EQUAL 100%**. 
- **Mobile Action**: When creating or editing milestones, ensure the UI validates that the total weight does not exceed or fall short of 100 before allowing a submission to the backend.

---

## 📦 3. Inventory Ledger APIs
Direct updates to `project_inventory_items.current_stock` are now **DEPRECATED**. 

### New Transaction Endpoint
**POST** `/api/projects/:projectId/inventory/:itemId/transaction`

**Payload Requirements**:
```json
{
  "action_type": "RECEIVING" | "CONSUMPTION" | "SPOILAGE" | "ADJUSTMENT",
  "quantity": number, // MUST be positive. The system handles the math.
  "reference_task_id": "UUID", // MANDATORY if action_type is 'CONSUMPTION'
  "notes": "string" // Optional
}
```

### Business Rules:
- **Task Linking**: Mobile users MUST select a Task when logging material 'CONSUMPTION'. Submissions without a `reference_task_id` will be rejected by the API with a `400 Bad Request`.
- **Auto-Sync**: Posting a transaction will automatically trigger the `trg_update_inventory_stock` trigger in PostgreSQL. The mobile app should refetch the item details or listen to the realtime channel to see the updated `current_stock`.

---

## 🔔 4. Notification Synchronization
The web dashboard and mobile app now share a unified `notifications` table.

### Supabase Realtime Subscription
The mobile app should subscribe to the `notifications` table filtered by the logged-in user:
```javascript
const channel = supabase
  .channel('my-notifications')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
    (payload) => { /* Handle new notification alert */ }
  )
  .subscribe();
```

### Legacy Field Support
To maintain compatibility with the mobile app's existing notification UI, the backend `NotificationService` explicitly populates these legacy fields:
- `date`: String format `YYYY-MM-DD`.
- `time`: String format `HH:mm AM/PM` (e.g., "10:30 AM").
- `reference_url`: A new field containing the web-side URL (e.g., `/tasks/uuid`). Mobile developers can parse this or use the existing `type` and `id` logic for navigation.

---

## 🔐 Role-Based Access Control (RBAC) Triggers
The backend now automatically fires notifications based on the following triggers. The mobile app should be prepared to handle these `type` categories:
- `WARNING`: Low stock, missed deadlines, or high spoilage alerts.
- `SUCCESS`: AI Vision count verification or milestone/project completion.
- `INFO`: New task assignments or mentions.

**Note**: Mentions are passed in an array `mentioned_user_ids` when posting comments or site updates.
