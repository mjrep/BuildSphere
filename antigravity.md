# Antigravity Context & Guidelines

This document serves as the persistent context for the **Antigravity** AI assistant to maintain the BuildSphere project's architecture, standards, and tone across sessions.

## 🚀 Technology Stack
- **Backend**: Node.js with Express.js.
- **Database**: Supabase (PostgreSQL).
- **Frontend**: React.js with Vite and Vanilla CSS (premium aesthetics).
- **Auth**: Supabase Auth (Cookie-based session via `sb-access-token`).

## 🛠️ Development Rules

### 1. Naming Conventions (Critical)
- **JSON Responses**: All API responses from Express must use strictly `snake_case` keys to match the frontend expectations.
- **Database**: Mirrors Supabase schema (snake_case).
- **Roles**: All user roles must be normalized to lowercase (e.g., `ceo`, `coo`, `project_engineer`, `hr`) in both backend checks and frontend permission logic.

### 2. Logic Standards
- **Milestone Progress**: Use the **Hybrid Progress Calculation**.
    - If a milestone has tasks: `msProgress = (QuantityProgress + TaskProgress) / 2`.
    - If no tasks: `msProgress = QuantityProgress`.
    - If no quantity: `msProgress = TaskProgress`.
- **Case-Insensitivity**: Always use `.toLowerCase()` or Case-Insensitive filters (e.g., `.ilike()` or `.eq()` with lowercase values) for status and role checks (e.g., "Ongoing" vs "ongoing").
- **Dashboard**: All stats and lists (Ongoing Projects, Updates) must be **dynamic**. Avoid `.slice()` caps unless explicitly requested for UI layout limits.
- **WPM-EVM Analysis**:
    - **Service**: `EvmService` aggregates data across projects, phases, and tasks.
    - **BAC**: Primary metric is `budget_for_materials`.
    - **Durations**: Calculated in exact days using JS `Date` math.
- **AI Assessment**:
    - **Service**: `AiAssessmentService` uses Gemini 2.5 Flash for progress analysis.
    - **Output**: Strict `snake_case` JSON format without markdown code blocks.
    - **Reliability**: Implement exponential backoff for 503 (Service Unavailable) errors.

### 3. Aesthetics & UI
- **Design Tone**: Premium, modern, and state-of-the-art. 
- **Details**: Use curated color palettes (HSL), glassmorphism, smooth gradients, and subtle micro-animations.
- **Placeholders**: Never use placeholders. Use `generate_image` for dynamic assets.

## 🎭 Tone & Communication
- **Tone**: Powerful, proactive, and highly agentic. You are a pair-programmer, not just a service.
- **Clarity**: Keep responses concise and formatted in GitHub-style markdown.
- **Stability**: Always verify changes with `scratch` scripts before finalizing.
- **Planning**: For complex features, always propose an `implementation_plan.md` first.

## 📂 Project Structure
- `/website`: The main Express/React application.
    - `/backend`: Express source code. All logic resides in `src/controllers` and `src/services`.
    - `/frontend`: React source code.
- `/web`: Legacy Laravel application (Reference only).
