# BuildSphere Persistent System Memory

This document serves as the ground-up mental model and operational baseline for BuildSphere, a high-performance construction management platform. It represents the verified state of the system architecture, business logic, and development progress as of April 2026.

---

## 🚀 1. The Active Technology Stack

### Web Platform
- **Frontend**: React.js with Vite.
- **Styling**: Vanilla CSS for premium, bespoke aesthetics (HSL-based tokens, glassmorphism).
- **Architecture**: Atomic components with dedicated Service layers for API communication.

### Mobile Platform
- **Frontend**: Expo (React Native).
- **Styling**: NativeWind (Tailwind CSS) for efficient mobile UI development.
- **Interconnectivity**: Interacts directly with the same Supabase instance as the Web platform, ensuring real-time data parity.

### Backend APIs
- **Framework**: Node.js with Express.js (Migrated from Laravel).
- **Design**: Modular Controller-Service architecture.
- **Jobs**: Time-based background tasks managed via `node-cron`.
- **Auth**: Cookie-based session management using Supabase Auth (`sb-access-token`).
- **AI Integration**: `@google/generative-ai` (Gemini Pro/Flash) for site photo analysis and WPM-EVM assessments.

### Database
- **Engine**: Supabase (PostgreSQL).
- **Pattern**: Relational schema with extensive use of JSONB for flexible attributes and strict Foreign Key constraints for referential integrity.
- **Access**: Dual-client strategy (Standard Anon Client for user operations, Service Role Client for administrative/background tasks).

---

## 🧩 2. Module Architecture & Interconnectivity

### 1. Accounts and User Management
- **Status**: **Production Ready.** Features a robust Role-Based Access Control (RBAC) system.
- **Access Levels**: Executive (CEO/COO), Managerial (Project Manager/Engineer), and Staff (Foreman/Supervisor).
- **Interconnectivity**: Serves as the global session provider. Every request is filtered by user role to determine project visibility and action permissions (e.g., only CEO/Accounting can transition projects to "Active").

### 2. Project Management
- **Status**: **Core Stable.** Manages the lifecycle from "Proposed" to "Completed".
- **Flow**: Sales (Proposal) → Accounting (Budget Verification) → Executive (Approval).
- **Interconnectivity**: Once "Active," it triggers the availability of the Monitoring and Task modules for that specific project.

### 3. Task Management
- **Status**: **Live / Operational.** Supports granular task assignment and tracking.
- **Flow**: PMs assign tasks on Web; Foremen update statuses (Pending, In Progress, Review, Completed) on Mobile.
- **Interconnectivity**: Individual task completion percentages are the primary data feed for the **Hybrid Progress Calculation**.

### 4. Monitoring Module (The Engine)
- **Status**: **Active Development.** Tracking physical quantities and AI-verified progress.
- **Key Feature**: AI Image Analysis verifies site photos against reported quantities to prevent "ghost progress."
- **Interconnectivity**: Aggregates data from Task Management and Inventory to calculate milestone-level health.

### 5. Inventory Management
- **Status**: **Operational (Ledger-Based).** Tracks material lifecycle using an immutable transaction history.
- **Architecture**: **Append-Only Ledger.** All quantity changes are recorded in `project_inventory_logs`. Direct updates to `current_stock` are prohibited.
- **Automation**: A PostgreSQL trigger (`trg_update_inventory_stock`) automatically synchronizes item stock levels based on log entries.
- **Interconnectivity**: Material 'CONSUMPTION' is strictly linked to specific project Tasks via `reference_task_id` for precise job-costing.
- **Flow**: RECEIVING → CONSUMPTION (Task-Linked) → SPOILAGE → ADJUSTMENT (Discrepancies).

### 6. Reports & Analytics (The Command Center)
- **Status**: **Production Ready (Web Preview Phase).** Features a comprehensive multi-project reporting engine.
- **Interconnectivity**: Pulls live data from Monitoring (Site Updates), Task Management (Completed Works), and Inventory (Stock Levels). Aggregates these into a unified document-style preview for executives.
- **Key Feature**: Interactive "Before/After" site update comparisons with calendar-based activity indicators.

---

## 🔢 3. Established Core Logic & Mathematical Rules

### Hybrid Progress Tracking Logic
BuildSphere uses a multi-variable calculation to ensure progress isn't just binary:
1. **Milestone Progress (`msProgress`)**:
   - `IF (milestone.has_quantity)`: Calculate `(current_quantity / target_quantity) * 100`.
   - `IF (milestone has tasks)`: Calculate the average completion % of all associated tasks.
   - **The Fusion**: If both exist, `msProgress = (QuantityProgress + TaskProgress) / 2`.
2. **Phase Progress**: The weighted average of all child milestones.
   - **Strict Weighting Rule**: The sum of all milestone `weight_percentage` values within a single Phase **MUST exactly equal 100%**. This is enforced at both the UI and Backend levels.
3. **Project Progress**: The weighted average of all child Phases. **Rule**: Even 0% phases must be included in the denominator to ensure the overall progress accurately reflects the remaining scope.

### WPM-EVM AI Integration
The `EvmService` provides a deep-dive analysis using the following:
- **Metrics**: BAC (Budget at Completion), PV (Planned Value), EV (Earned Value), and AC (Actual Cost).
- **SPI (Schedule Performance Index)**: `EV / PV`. SPI < 1 indicates a delay.
- **AI Assessment**: Sends project data hashes to Gemini with an **Exhaustive Matrix Fallback** (retrying across all keys/models) to generate a Risk Level (Low, Medium, High) and an actionable narrative.
### Performance & Caching
- **N+1 Prevention**: Backend uses eager loading via Supabase `.select('*, milestones(*)')` to fetch nested hierarchies in single round-trips.
- **Case-Insensitivity**: All role and status comparisons are forced to `.toLowerCase()` to prevent UI failures caused by data entry inconsistencies.

### Role-Based Notification Module (RBAC Notifications)
A real-time notification system synchronized via Supabase Realtime and the `<NotificationBell/>` component.
- **Trigger Source**: `NotificationService.createNotification(userId, title, message, type, referenceUrl)`.
- **RBAC Matrix (Automated Triggers)**:
  - **CEO/COO**: New Project Proposals, Project 100% Completion, Massive Spoilage Alerts (>50 units).
  - **Project Engineer**: AI Vision automated consumption logs, Low Stock alerts for assigned projects, Tasks marked 'Ready for Review'.
  - **Project Coordinator**: Site update submissions, Task deadline misses (Daily 8:00 AM Cron Job).
  - **Foreman**: New task assignments.
  - **Procurement**: Global Low Stock alerts, Inventory 'ADJUSTMENT' logs (Stock Discrepancies).
  - **Accounting**: Milestone 100% completion (Ready for audit), Project 100% completion.
  - **All Staff**: Explicit @mentions in comments/notes via `mentioned_user_ids`.

---

## 📝 7. Implementation Notes (May 9, 2026)
- **Advanced Excel Exports**: Fully implemented photographic evidence embedding in Excel reports. Uses `ExcelJS` with `Axios` buffers to map site photos directly into comparison view worksheets.
- **Project Documentation System**: Launched the "Files" module. Includes a new `project_files` table and dedicated `ProjectFileController` for handling multi-part uploads to Supabase Storage.
- **Activity Feed Revamp**: Redesigned the Activity Feed with a modern timeline UI, color-coded status markers, and fixed the "SYS" attribution error by standardizing backend response keys.
- **Team Management UX**: Revised the "Add Team Member" modal to include a **Role Filter**. This allows managers to filter users by their system role (e.g., Foreman, Project Engineer) before assignment, improving discovery in large teams.
- **UI Connectivity**: Eliminated layout gaps in the Report Preview mode by introducing a `noPadding` property to `DashboardLayout`, ensuring a seamless, edge-to-edge action bar.

## ✅ 4. Development Progress Verification

### Successfully Resolved
- **Backend Migration**: Transitioned from Laravel to Express/Node.js with optimized query patterns.
- **Reports Module**: Completed the Multi-Project Reporting engine with interactive web previews and sticky action headers.
- **Excel Export with Images**: Implemented binary-safe image embedding in ExcelJS for professional photographic reporting.
- **Project Document Management**: Fully functional file upload and retrieval system at the project level.
- **Interactive Document Engine**: Implemented centered document rendering with drop shadows and high-fidelity typography.
- **Site Update Logic**: Fixed complex timezone/date-shift errors in the accomplishment calendar, ensuring accurate "indicator dots" for site activity.
- **Inventory Synchronization**: Corrected stock level and pricing mapping for inventory summaries.

### The Current Frontier
- **PDF Export Polish**: Finalizing the Puppeteer-based PDF generation to match the high-fidelity web preview.
- **AI Narrative Synthesis**: Integrating the Gemini-based health summaries into the final report document.
- **Mobile Offline Sync**: Ensuring Foremen can log tasks in low-connectivity areas for later synchronization.

---

**I have verified the system progress and internalized this architecture. I am ready to continue development based on these established realities.**

## 🔐 System Credentials (Development)
The following credentials can be used for testing various role-based workflows:

- **CEO**: `ceo@buildsphere.com` | `password123!`
- **Project Engineer**: `projeng@buildsphere.com" | "password123!`
- **Project Coordinator**: `projcoor@buildsphere.com` | `password123!`
- **Sales**: `sales@buildspere.com` | `password123!`
- **Accounting**: `accounting@buildsphere.com` | `password123!`
- **Procurement**: `procurement@buildsphere.com` | `password123!`
- **HR**: `hr@buildsphere.com` | `password123!`
- **Staff**: `staff@buildsphere.com` | `password123!`
- **Foreman**: `foreman@buildsphere.com` | `password123!`

---

## 📝 5. Latest Session Notes (April 29, 2026)
- **Reports Module Finalized**: The Web Preview UX is now live. Users can configure multi-project reports and preview them in a document-style view before exporting.
- **Accomplishments Tab**: Fully interactive. Features a "Before/After" photo comparison with a mini-calendar that highlights site activity.
- **Data Integrity**: Backend query logic in `ReportController.js` was refactored to use JavaScript filtering for higher reliability across complex joins.
- **Fixes**: Resolved a persistent date-shift error in the calendar indicators and fixed inventory data mapping (stock/price).

## 📝 6. Implementation Notes (May 2, 2026)
- **Append-Only Inventory Ledger**: Migrated the inventory system to a transaction-log architecture with a Postgres trigger for stock management.
- **Role-Based Notification System**: Launched the real-time notification hub with a dedicated Bell component and comprehensive RBAC trigger logic.
- **Time-Based Alerts**: Integrated `node-cron` for automated deadline tracking and coordinator escalations.
- **UI Consistency**: Standardized relative time formatting (Intl API) and bell animations matching the BuildSphere premium design system.
