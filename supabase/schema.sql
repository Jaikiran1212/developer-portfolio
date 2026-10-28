-- ==============================================================================
-- JAI KIRAN - DEVELOPER PORTFOLIO & ADMIN CMS DATABASE SCHEMA
-- PostgreSQL Schema for Supabase with Row Level Security (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ADMIN USERS TABLE
-- Tracks which Supabase Auth users have explicit administrative privileges.
-- Being authenticated does NOT grant admin rights unless listed here with role 'admin'.
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Security Definer function to safely check admin status in RLS policies without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

-- 3. PORTFOLIO PROFILE
CREATE TABLE IF NOT EXISTS public.profile (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Singleton pattern
    greet TEXT NOT NULL DEFAULT 'Hi, I am',
    name TEXT NOT NULL DEFAULT 'Jai Kiran',
    subs TEXT[] NOT NULL DEFAULT ARRAY['Frontend Developer', 'Full-Stack Engineer', 'Cybersecurity Enthusiast'],
    lead_bio TEXT NOT NULL DEFAULT 'Computer Science & Engineering student at Amrita Vishwa Vidyapeetham with hands-on experience in web development, interactive algorithmic visualizers, and cybersecurity incident analysis.',
    email TEXT NOT NULL DEFAULT 'jaikiranjp@gmail.com',
    phone TEXT NOT NULL DEFAULT '+91 9445187244',
    location TEXT NOT NULL DEFAULT 'Trichy / Coimbatore',
    resume_url TEXT DEFAULT '',
    font_preset TEXT NOT NULL DEFAULT 'Cyber Geometric',
    theme TEXT NOT NULL DEFAULT 'Alternating Contrast',
    photo_config JSONB NOT NULL DEFAULT '{
      "src": "",
      "width": 400,
      "height": 480,
      "scale": 1,
      "x": 0,
      "y": 0,
      "feather": 10,
      "bgMode": "Transparent / None",
      "frame": "cutout",
      "autoCutout": true,
      "cutoutTolerance": 38
    }'::jsonb,
    logo_config JSONB NOT NULL DEFAULT '{"preset":"hex-ribbon","custom_url":"","primary_color":"#22d3ee","secondary_color":"#8b5cf6"}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Existing databases created before this column existed: see supabase/migrations/001_add_logo_config.sql
ALTER TABLE public.profile ADD COLUMN IF NOT EXISTS logo_config JSONB NOT NULL DEFAULT '{"preset":"hex-ribbon","custom_url":"","primary_color":"#22d3ee","secondary_color":"#8b5cf6"}'::jsonb;

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Frontend', 'Full-Stack', 'Cybersecurity', 'DSA', 'Systems')),
    short_desc TEXT NOT NULL,
    problem_statement TEXT DEFAULT '',
    solution TEXT DEFAULT '',
    architecture TEXT DEFAULT '',
    my_contribution TEXT DEFAULT '',
    challenges TEXT DEFAULT '',
    measurable_results TEXT DEFAULT '',
    notes_markdown TEXT DEFAULT '',
    tech_stack TEXT[] NOT NULL DEFAULT '{}',
    repo_url TEXT DEFAULT '',
    live_url TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    featured BOOLEAN NOT NULL DEFAULT false,
    published BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. EXPERIENCE & CERTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.experience (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL DEFAULT 'experience' CHECK (category IN ('experience', 'simulation', 'education', 'certification')),
    organization TEXT NOT NULL,
    role_title TEXT NOT NULL,
    duration TEXT NOT NULL,
    points TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    credential_url TEXT DEFAULT '',
    published BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
    id SERIAL PRIMARY KEY,
    tier TEXT NOT NULL CHECK (tier IN ('now', 'learn', 'cyber')),
    name TEXT NOT NULL,
    icon_type TEXT NOT NULL DEFAULT 'slug' CHECK (icon_type IN ('slug', 'svg', 'url')),
    icon_value TEXT NOT NULL,
    proficiency_label TEXT NOT NULL DEFAULT 'Proficient',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. SOCIAL & CODING LINKS TABLE
CREATE TABLE IF NOT EXISTS public.social_links (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'website',
    show_hero BOOLEAN NOT NULL DEFAULT true,
    show_contact BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. CONTACT MESSAGES TABLE
-- Public users can insert; only verified administrators can select/update/delete.
CREATE TABLE IF NOT EXISTS public.messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    ip_hash TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. AUDIT LOGS TABLE
-- Tracks security and administrative mutations without storing secrets/passwords.
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ADMIN USERS POLICIES
CREATE POLICY "Admins can view admin_users"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- PROFILE POLICIES
CREATE POLICY "Public read profile"
    ON public.profile FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admin update profile"
    ON public.profile FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- PROJECTS POLICIES
CREATE POLICY "Public read published projects"
    ON public.projects FOR SELECT
    TO anon, authenticated
    USING (published = true OR public.is_admin());

CREATE POLICY "Admin write projects"
    ON public.projects FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- EXPERIENCE POLICIES
CREATE POLICY "Public read published experience"
    ON public.experience FOR SELECT
    TO anon, authenticated
    USING (published = true OR public.is_admin());

CREATE POLICY "Admin write experience"
    ON public.experience FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- SKILLS POLICIES
CREATE POLICY "Public read skills"
    ON public.skills FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admin write skills"
    ON public.skills FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- SOCIAL LINKS POLICIES
CREATE POLICY "Public read social links"
    ON public.social_links FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admin write social links"
    ON public.social_links FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- MESSAGES POLICIES
-- Zero public read; public can only insert through validated form; admin can read/update/delete.
CREATE POLICY "Public can insert message"
    ON public.messages FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(name) >= 2 AND length(name) <= 120 AND
        length(email) >= 5 AND length(email) <= 255 AND
        length(subject) >= 2 AND length(subject) <= 200 AND
        length(message) >= 5 AND length(message) <= 4000
    );

CREATE POLICY "Admin read messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admin update messages"
    ON public.messages FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete messages"
    ON public.messages FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- AUDIT LOGS POLICIES
CREATE POLICY "Admin read audit_logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admin insert audit_logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- AUTOMATED TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_experience_updated_at
    BEFORE UPDATE ON public.experience
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_profile_updated_at
    BEFORE UPDATE ON public.profile
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
