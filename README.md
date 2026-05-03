# BuildSphere 🏗️

## 🛠️ Technology Stack

- **Backend**: Node.js / Express.js 
- **Frontend**: React.js / Vite 
- **Database**: Supabase / PostgreSQL
- **Mobile**: Expo / React Native 
- **AI**: Google Generative AI 
- **Scheduler**: Node-Cron

---

## 🚀 Getting Started: Step-by-Step Setup

Follow these instructions to get a local development environment up and running.

### 1. Database & Schema Setup
BuildSphere uses Supabase for the database, authentication, and real-time features.
1. Create a new project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Execute the core schema migrations. You should also run the recent architectural updates found in the `website/backend/scratch` folder:
   - `inventory_ledger_setup.sql`: To initialize the append-only ledger and triggers.
   - `notifications_update.sql`: To enable real-time notifications.
   - `add_milestone_weights.sql`: To prepare the project weighting logic.

### 2. Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd website/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `website/backend` and populate it:
   ```env
   PORT=3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_google_ai_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd website/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `website/frontend`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_API_URL=http://localhost:3000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 4. Accessing the Platform
Once both servers are running:
- **Web Dashboard**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **API Documentation**: The backend runs at [http://localhost:3000/api](http://localhost:3000/api).
- **Default Credentials**: Check the `antigravity.md` file for development user accounts (CEO, Project Engineer, etc.).

---

