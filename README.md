# Jai Kiran – Developer Portfolio & Secure Admin CMS

A production-ready, security-hardened, and responsive developer portfolio featuring an interactive visual design system and an administrative Content Management System (CMS) powered by **Supabase Auth**, **Supabase PostgreSQL with Row Level Security (RLS)**, and **Vercel Serverless Functions**.


---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              Vercel Global Edge               │
                      │  (Static Asset CDN + vercel.json Security)    │
                      └──────────────────────┬────────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
         ┌─────────────▼──────────────┐             ┌──────────────▼─────────────┐
         │     Vite Frontend SPA      │             │  Vercel Serverless API     │
         │  (HTML5, Vanilla CSS, JS)  │             │      (/api Functions)      │
         └─────────────┬──────────────┘             └──────────────┬─────────────┘
                       │                                           │
                       │ Public / Authenticated                    │ Service-Role
                       │ Token Operations                          │ Privileged Operations
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                              ┌──────────────▼─────────────┐
                              │     Supabase Platform      │
                              │  - Supabase Auth (JWT)     │
                              │  - PostgreSQL + RLS        │
                              │  - Audit Logging           │
                              └────────────────────────────┘
```

### Technology Stack
- **Frontend & Aesthetics:** Modern HTML5 Semantic Landmarks, Vanilla CSS with custom design tokens, Syne / JetBrains Mono typography, 60fps Canvas Constellation particle engine, CSS 3D Tilt, and SVG non-scaling animations.
- **Frontend Bundler:** Vite (189ms production build, zero runtime bloat).
- **Hosting Platform:** Vercel (Edge CDN + Serverless Functions).
- **Authentication:** Supabase Auth (email/password with cryptographic JWT verification and session handling).
- **Database & Storage:** Supabase PostgreSQL with automated triggers and Row Level Security (RLS).
- **Security & Authorization:** Explicit administrator checks (`admin_users` table), server-side input sanitization, sliding window rate limiting, anti-spam honeypot, and audit logging.
- **Testing:** Node.js native test runner (`node:test` and `node:assert`) covering auth, validation, rate limiting, and CMS API operations.

---

## Key Features

### 1. High-Impact Visual Identity & Portfolio Presentation
- **Hero Section:** Diagonal split hero layout with animated geometric monogram (`JK`), typewriter title ticker, and interactive 3D portrait frame with orb rings, scanlines, and floating badges.
- **Interactive Constellation Canvas:** Background particle network with mouse attraction, connecting lines, and pause support for `prefers-reduced-motion`.
- **Engineering Pillars:** Highlights core competencies in Web Development, Cybersecurity & Systems, and Algorithms & Data Structures.
- **Categorized Skills:** Three-tier classification (`01 // Using Now`, `02 // Leveling Up`, `03 // Cybersecurity & Enterprise Tools`) with interactive icon animations.
- **Experience Timeline:** Dynamic progress line fill on scroll, milestone dates, key takeaway bullets, and verified completion credentials.
- **Project Case Studies:** Projects are presented as in-depth engineering case studies (Problem Statement, Solution & Approach, System Architecture, Individual Contribution, Challenges Overcome, Measurable Outcomes).
  - *SpiceGarden – Responsive Restaurant Website* (99+ Lighthouse, zero dependencies).
  - *DLX Sudoku Solver with Algorithm Visualization* (Knuth's Algorithm X quad-linked toroidal matrices in real time).
  - *CampusWatch: Campus Infrastructure Anomaly & Incident Management* (Cloud Firestore RBAC, real-time reporting, and query indexing).
- **Contact Channel:** Validated contact form with sliding window rate limiting, honeypot spam traps, instant toast alerts, and confetti celebration animation.

### 2. Upgraded Admin CMS (`/admin`)
The insecure legacy PIN (`1212`) and `localStorage` authentication have been completely replaced with a professional CMS:
- **Dashboard:** Real-time metrics (Case Studies, Active Skills, Experience Items, Unread Inquiries) and an immutable audit log feed.
- **Projects Manager:** Create, edit, preview case studies, reorder, toggle published/draft state, and delete.
- **Experience Manager:** Add, edit, reorder, and delete simulation milestones and credentials.
- **Skills Manager:** Assign category tiers, pick built-in SVG icons or paste custom vectors, and specify credible proficiency labels.
- **Profile & Hero Photo Studio:** Edit biography, contact info, typography presets, theme modes, and live drag-and-drop hero photo positioning with zoom, offset, and cutout sliders.
- **Socials Manager:** Manage professional profile URLs and toggle visibility on Hero vs. Contact sections.
- **Messages Center:** Triage incoming visitor submissions, mark as Read/Unread, Archive, or Reply via pre-filled email links.
- **Audit Logs:** Full visibility into administrative mutations and security events.

---

## Local Development & Setup

### 1. Prerequisites
- Node.js v18+ (tested on Node.js v22.22)
- npm v9+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Jaikiran1212/developer-portfolio.git
cd developer-portfolio

# Install dependencies
npm install
```

### 3. Run Automated Tests
```bash
npm test
```
*Executes all 20 automated unit and integration tests (validation, rate limiting, token verification, and API handlers).*

### 4. Start Local Development Server
```bash
npm run dev
```
*Launches Vite local dev server at `http://localhost:3000` with hot module replacement.*

### 5. Build for Production
```bash
npm run build
```
*Compiles minified production bundle in `dist/`.*

---

## Database Configuration & Vercel Deployment

For complete, step-by-step instructions on setting up Supabase, configuring Row Level Security (RLS), and deploying to Vercel, please read:
👉 **[DEPLOYMENT.md](file:///home/jaikiran/Downloads/Portfolio/DEPLOYMENT.md)**

---

## License
MIT License. Created by Jai Kiran (2026).
