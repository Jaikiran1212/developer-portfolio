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
5. Expand **Environment Variables** and add everything in `.env.example` (see that file for the full, commented list).
   **Required:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `IP_HASH_SALT`.
   **Recommended:** `UPSTASH_REDIS_REST_URL/TOKEN` (shared rate limits), `RESEND_API_KEY` + `CONTACT_NOTIFY_EMAIL` (new-message e-mails), optional Turnstile keys.
   Set them for **Production AND Preview**. If they are missing, the API now answers `503` (it fails closed) instead of letting anyone in.
6. Click **Deploy**. Vercel will build the frontend into `dist/` and configure the `/api` serverless endpoints.

### Method B: Deploy via Vercel CLI (No sudo needed)

Use `npx vercel` directly without needing global sudo install permissions:

```bash
# 1. Link your project to Vercel (interactive login)
npx vercel

# 2. Add your production environment variables / secrets
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add ADMIN_EMAILS production

# 3. Deploy to production
npx vercel --prod
```

*(Note: If you prefer installing the CLI globally on Linux, run `sudo npm i -g vercel`)*

---

## 5. Security Checklist & Verification

- [x] **Fail-closed auth:** no Supabase config = `503`, never an open login. The offline dev login exists only when `ALLOW_DEV_AUTH=1` AND the code is not on Vercel.
- [x] **Sessions:** HttpOnly + SameSite=Strict cookies (not readable by page scripts) with automatic refresh; CSRF header required for cookie-authenticated writes.
- [x] **Password reset:** uses only Supabase's e-mailed code (`verifyOtp`); no code is ever returned in a response; only administrators can reset.
- [x] **Explicit Authorization:** user must be in `admin_users` (or `ADMIN_EMAILS` with a confirmed e-mail).
- [x] **Database Isolation:** Row Level Security denies public access to `messages` and `audit_logs`.
- [x] **Output encoding:** text is stored raw and escaped only when rendered (no double-escaping). Custom SVG icons are validated on the server and sanitised in the browser; all URL fields accept only http(s)/mailto/tel.
- [x] **Abuse Protection:** shared rate limiting (Upstash) + optional Cloudflare Turnstile + honeypot.
- [x] **Contact messages are never silently lost:** a database failure returns an error with your fallback e-mail; new messages trigger Resend/Telegram notifications.
- [x] **Auditing:** admin actions are logged to `audit_logs` without secrets.
- [x] **Headers:** strict CSP (no inline scripts), HSTS, X-Frame-Options `DENY`, nosniff.
- [x] **Admin on its own page:** `/admin` (noindex, no-store) is a separate bundle - public visitors never download the CMS.

### One-time steps after deploying this version
1. **Supabase -> Authentication -> Providers -> Email:** turn **off "Allow new users to sign up"** (and keep "Confirm email" on).
2. **Supabase -> Authentication -> Email Templates:** make the *Reset Password* and *Magic Link* templates show the 6-digit code with `{{ .Token }}` (the reset flow asks for that code).
3. Run `supabase/fix-double-escape.sql` once (repairs text that was saved as `&#x27;` / `&amp;`).
4. Rotate the Vercel token that was inside `.env.local` (`vercel logout` then `vercel login`) and do not zip/share `.env.local`, `.vercel/` or `node_modules/`.
5. In **Admin -> Profile -> Photo Studio** set the photo to width 520 / height 620 if you want the larger hero portrait (new installs get it automatically).
