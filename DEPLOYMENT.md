# Deployment, Architecture & Security Guide: Vercel vs. GitHub Pages

This guide outlines the production architecture, secrets management, and deployment procedures for **Jai Kiran's Developer Portfolio & Admin CMS**.

---

## 1. Architectural Comparison: GitHub Pages vs. Vercel

| Evaluation Criteria | GitHub Pages | Vercel (Selected Architecture) |
| :--- | :--- | :--- |
| **Hosting Model** | Purely static asset delivery (HTML, CSS, JS). | Hybrid static Edge CDN + Serverless & Edge API Functions. |
| **Backend & Privileged Logic** | **Unsupported.** Cannot execute Node.js or server-side functions. | **Native Support.** `/api` serverless endpoints execute privileged operations securely. |
| **Authentication & Authorization** | Any secret or key must be embedded in client-side JS, making privileged operations impossible. | Can keep `SUPABASE_SERVICE_ROLE_KEY` and private configs strictly on the server in encrypted environment variables. |
| **Admin CMS Security** | Cannot securely verify admin privileges; vulnerable to client-side auth bypasses (like the old `PIN` / `localStorage` check). | Server-side verification (`api/_lib/auth.js`) checks JWT and `admin_users` table before permitting data mutations. |
| **Contact Form & Abuse Defense** | Requires third-party forms or exposing database insert credentials to public client JS without rate limiting. | First-party `/api/contact` endpoint with in-memory sliding window rate limiting, honeypot spam protection, and audit logging. |
| **HTTP Security Headers** | Very limited; custom headers cannot be set on standard GitHub Pages. | Configurable via `vercel.json` (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`). |
| **Preview Deployments** | Manual branch management or third-party Actions. | Automatic preview environments generated for every pull request. |
| **Verdict** | Suitable only for simple, static-only hobby websites without an admin CMS. | **The industry standard for production developer portfolios with secure administrative CMS and dynamic backend capabilities.** |

---

## 2. Secrets Management & Credential Segregation

To adhere strictly to zero-trust security standards:
- **Never expose privileged secrets in frontend code, HTML, or Git repositories.**
- **Client-Side (Browser):** Only accesses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These keys are public by design in Supabase architecture and are strictly constrained by PostgreSQL **Row Level Security (RLS)**.
- **Server-Side (`/api` Functions):** Only serverless endpoints access `SUPABASE_SERVICE_ROLE_KEY` to verify tokens, write audit logs, or perform privileged administrative tasks. This key is never included in the Vite frontend bundle.

---

## 3. Supabase PostgreSQL & Row Level Security Setup

### Step 1: Create a Supabase Project
1. Navigate to [Supabase](https://supabase.com/) and create a new project.
2. Under **Project Settings -> API**, copy your **Project URL**, **anon public key**, and **service_role secret**.

### Step 2: Execute Schema & Seed Migrations
1. In the Supabase Dashboard, open the **SQL Editor**.
2. Copy and paste the contents of [`supabase/schema.sql`](file:///home/jaikiran/Downloads/Portfolio/supabase/schema.sql) and click **Run**.
   - This creates `admin_users`, `profile`, `projects`, `experience`, `skills`, `social_links`, `messages`, and `audit_logs`.
   - It enables Row Level Security (RLS) on all tables and provisions security definer functions.
3. Open a new query in the SQL Editor, paste the contents of [`supabase/seed.sql`](file:///home/jaikiran/Downloads/Portfolio/supabase/seed.sql), and click **Run**.
   - This seeds Jai Kiran's verified profile data, case studies (SpiceGarden, DLX Sudoku Solver, CampusWatch Anomaly System), job simulations, and skills.

### Step 3: Provision Your Initial Administrator
1. In Supabase Dashboard, go to **Authentication -> Users** and click **Add User -> Create User**.
2. Enter your admin email (e.g. `jaikiranjp@gmail.com`) and a strong password (minimum 12 characters with upper, lower, numbers, and symbols).
3. Copy the generated **User UID** (a UUID like `e7b91932-514d-4bc6-8d1e-2cf0f95b0d01`).
4. In the SQL Editor, execute:
   ```sql
   INSERT INTO public.admin_users (id, email, role)
   VALUES ('YOUR_COPIED_USER_UID', 'jaikiranjp@gmail.com', 'admin')
   ON CONFLICT (id) DO NOTHING;
   ```
5. Your administrator is now explicitly authorized in PostgreSQL. Authenticated users not listed in `admin_users` will be denied CMS write access by RLS policies and server endpoints.

---

## 4. Vercel Deployment Instructions

### Method A: Deploy via GitHub & Vercel Dashboard (Recommended)

1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "feat: production developer portfolio with secure supabase cms"
   git branch -M main
   git remote add origin https://github.com/Jaikiran1212/developer-portfolio.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com/) and click **Add New... -> Project**.
3. Import your `developer-portfolio` repository.
4. In the **Configure Project** screen:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add the following:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Anon Public Key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase Service Role Secret (Server-Only) |
   | `ADMIN_EMAILS` | `jaikiranjp@gmail.com` | Comma-separated authorized admin emails |
6. Click **Deploy**. Vercel will build the frontend into `dist/` and configure the `/api` serverless endpoints.

### Method B: Deploy via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link and deploy
vercel

# Add production secrets
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ADMIN_EMAILS production

# Deploy to production
vercel --prod
```

---

## 5. Security Checklist & Verification

- [x] **Hardcoded PIN Removed:** Legacy PIN check (`1212`) and `localStorage` bypass eliminated.
- [x] **Authentication:** Supabase Auth password verification with session management.
- [x] **Explicit Authorization:** User must exist in `admin_users` table to perform CMS mutations.
- [x] **Database Isolation:** PostgreSQL Row Level Security denies public access to `messages` and `audit_logs`.
- [x] **Input Sanitization:** Stored XSS defense using server-side HTML entity escaping.
- [x] **Abuse Protection:** Sliding window rate limiting on contact submissions (5 per 15 min) and logins (5 per 15 min).
- [x] **Anti-Spam:** Honeypot field traps automated bots silently without saving spam.
- [x] **Auditing:** Administrative actions are logged to `audit_logs` without recording passwords or secrets.
- [x] **Headers:** CSP, X-Frame-Options (`DENY`), and nosniff configured in `vercel.json`.
- [x] **Offline Resilience:** If Supabase is unreachable or credentials are not yet set, the portfolio seamlessly falls back to pre-seeded static data so it never displays a blank error page.
