# BuildSphere Project Architecture & Context Guide

## 🏗️ System Overview
BuildSphere is a modern project management ecosystem built exclusively on a web-first architecture. The repository contains a cohesive web application structure powered by a Node.js backend and a React frontend. The application leverages Supabase for its PostgreSQL database, real-time functionality, and robust authentication.

## 🧩 Component Architecture

The entirety of the project resides under the `website/` directory, which is divided into a frontend client and a backend service.

### 1. Frontend (`website/frontend`)
The user interface designed for administration, daily operations, and project tracking.
- **Framework & Tooling**: React 19 + Vite + TailwindCSS 4.
- **Core Dependencies**: React Router DOM, Axios, `@supabase/supabase-js`.
- **UI & UX Themes**: Includes advanced front-end styling such as a **Discord-Style Dark Mode**, leveraging custom React contexts and Tailwind for seamless theme switching.
- **Reporting Utilities**: `html2canvas`, `jspdf`, and `xlsx` for comprehensive data extraction and client-side report rendering.
- **Structure**:
  - **`src/components`**: Reusable UI components conforming to the project's premium design language.
  - **`src/pages`**: Full page views mapping to specific routes.
  - **`src/routes/AppRoutes.jsx`**: Centralized application routing structure.
  - **`src/hooks` & `src/context`**: State management for authentication, dark mode theming, and layout preferences.

### 2. Backend (`website/backend`)
The primary API service that coordinates data flow, permissions, and complex business logic.
- **Framework & Tooling**: Node.js + Express.
- **Key External Integrations**:
  - `@supabase/supabase-js`: Backend-to-database communications using service-role capabilities where needed.
  - `@google/generative-ai`: Interfacing with Gemini for automated AI project assessments.
  - `nodemailer` & `puppeteer` & `exceljs`: Powering the **Report Module Functionality** to generate automated emails, PDFs, and Excel spreadsheets server-side.
- **Structure**:
  - **`src/index.js`**: Main entry point mounting all middleware and routes.
  - **`src/controllers/`**: Logic controllers covering `Project`, `Task`, `Auth`, `Dashboard`, `Inventory`, `Reports`, and `Notifications`.
  - **`src/jobs/`**: Scheduled background tasks (`deadlineChecker.js` via node-cron).
  - **`src/middleware/`**: Token authentication, project state locking, and file upload parsing.

## 🗄️ Database & Infrastructure
- **Provider**: [Supabase](https://supabase.com/)
- **Core Engine**: PostgreSQL
- **Key Schemas & Capabilities**:
  - **Supabase Auth**: Serves as the backbone for identity management, completely integrated with custom app user profiles.
  - **Current Stock Tracking**: An append-only inventory ledger system (`projectInventoryController.js`) ensuring immutable stock tracking and history.
  - **Project Progress Logic**: Dedicated modules for milestones tracking, task progress logs, and Earned Value Management (EVM) data analysis.
  - **Real-time Notifications**: Trigger-based subscriptions ensuring live updates across the platform.

## 🔄 Development History & Key Milestones
Recent system enhancements have heavily shaped the current architecture:
1. **Setting Up Supabase Auth & Email Delivery**: Built robust auth, forgot-password/reset flows using token generation via Nodemailer (Gmail/Mailtrap).
2. **Implementing Discord-Style Dark Mode**: Extended the frontend architecture to support dynamic, premium dark-mode aesthetics.
3. **Adding Current Stock Tracking**: Designed a highly reliable backend API and Supabase schema to accurately track real-time project inventory.
4. **Analyzing Project Progress Logic**: Built sophisticated task mapping, progress logs, and AI-assessed milestone reports for deeper insights.
5. **Explaining Report Module Functionality**: Established PDF and Excel generation logic, moving heavy processing to the backend using Puppeteer and ExcelJS.
6. **Fixing UUID Bigint Cast Error**: Resolved critical strict-type issues in Postgres relationships to ensure robust relational queries.
7. **Syncing Project Changes & Architecture**: Consolidated the ecosystem into a singular, unified `website/` repository structure.

## 🚀 Setup & Development Workflow

### Prerequisites
- Node.js (v18+)
- A Supabase Project (Database, Auth, and Storage)
- Google Generative AI API Key

### Quick Start Guide

**1. Environment Variables**
Configure `.env` files in both `website/backend` and `website/frontend`:
- `SUPABASE_URL` / `VITE_SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Backend only)
- `GEMINI_API_KEY` (Backend only)

**2. Running the Application**
```bash
# Terminal 1: Backend
cd website/backend
npm install
npm run dev # Starts Express server on port 3000

# Terminal 2: Frontend
cd website/frontend
npm install
npm run dev # Starts Vite server on port 5173
```

## 📌 Development Standards
1. **API Interactivity**: Frontend relies extensively on the Node backend for business logic (e.g., Reports, Inventory logic), using Supabase direct calls mainly for stateless or real-time views.
2. **Aesthetics & UI**: Leverage Tailwind CSS for responsive design, prioritizing the integrated Dark Mode.
3. **Security**: Sensitive operations (e.g., AI integration, administrative data mutation) must be verified server-side via backend middleware.
