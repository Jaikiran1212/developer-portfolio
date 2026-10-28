// Generates supabase/seed.sql from data/portfolio.json (single source of truth).
// Usage: npm run seed:gen
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'data/portfolio.json'), 'utf8'));

const q = (v) => `'${String(v ?? '').replace(/'/g, "''")}'`;
const arr = (a) => `ARRAY[${(a || []).map(q).join(', ')}]::text[]`;
const bool = (b) => (b ? 'true' : 'false');
const json = (o) => `${q(JSON.stringify(o))}::jsonb`;
const p = d.profile;

let sql = `-- ==============================================================================
-- JAI KIRAN - DEVELOPER PORTFOLIO SEED DATA
-- GENERATED FILE - edit data/portfolio.json, then run: npm run seed:gen
-- ==============================================================================

-- 1. PROFILE
INSERT INTO public.profile (id, greet, name, subs, lead_bio, email, phone, location, resume_url, font_preset, theme, photo_config)
VALUES (1, ${q(p.greet)}, ${q(p.name)}, ${arr(p.subs)}, ${q(p.lead_bio)}, ${q(p.email)}, ${q(p.phone)}, ${q(p.location)}, ${q(p.resume_url)}, ${q(p.font_preset)}, ${q(p.theme)}, ${json(p.photo_config)})
ON CONFLICT (id) DO UPDATE SET greet = EXCLUDED.greet, name = EXCLUDED.name, subs = EXCLUDED.subs, lead_bio = EXCLUDED.lead_bio,
  email = EXCLUDED.email, phone = EXCLUDED.phone, location = EXCLUDED.location, resume_url = EXCLUDED.resume_url,
  font_preset = EXCLUDED.font_preset, theme = EXCLUDED.theme, photo_config = EXCLUDED.photo_config;

-- 2. PROJECTS
`;
for (const x of d.projects) {
  sql += `INSERT INTO public.projects (slug, title, category, short_desc, problem_statement, solution, architecture, my_contribution, challenges, measurable_results, notes_markdown, tech_stack, repo_url, live_url, image_url, featured, published, display_order)
VALUES (${q(x.slug)}, ${q(x.title)}, ${q(x.category)}, ${q(x.short_desc)}, ${q(x.problem_statement)}, ${q(x.solution)}, ${q(x.architecture)}, ${q(x.my_contribution)}, ${q(x.challenges)}, ${q(x.measurable_results)}, ${q(x.notes_markdown)}, ${arr(x.tech_stack)}, ${q(x.repo_url)}, ${q(x.live_url)}, ${q(x.image_url)}, ${bool(x.featured)}, ${bool(x.published !== false)}, ${Number(x.display_order) || 0})
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, short_desc = EXCLUDED.short_desc, problem_statement = EXCLUDED.problem_statement,
  solution = EXCLUDED.solution, architecture = EXCLUDED.architecture, my_contribution = EXCLUDED.my_contribution, challenges = EXCLUDED.challenges,
  measurable_results = EXCLUDED.measurable_results, notes_markdown = EXCLUDED.notes_markdown, tech_stack = EXCLUDED.tech_stack, repo_url = EXCLUDED.repo_url,
  live_url = EXCLUDED.live_url, image_url = EXCLUDED.image_url, featured = EXCLUDED.featured, published = EXCLUDED.published, display_order = EXCLUDED.display_order;

`;
}
sql += `-- 3. EXPERIENCE & CERTIFICATIONS (re-seeding replaces these rows)
DELETE FROM public.experience;
INSERT INTO public.experience (category, organization, role_title, duration, points, tags, credential_url, published, display_order) VALUES
${d.experience.map((x) => `  (${q(x.category)}, ${q(x.organization)}, ${q(x.role_title)}, ${q(x.duration)}, ${arr(x.points)}, ${arr(x.tags)}, ${q(x.credential_url)}, ${bool(x.published !== false)}, ${Number(x.display_order) || 0})`).join(',\n')};

-- 4. SKILLS (re-seeding replaces these rows)
DELETE FROM public.skills;
INSERT INTO public.skills (tier, name, icon_type, icon_value, proficiency_label, display_order) VALUES
${d.skills.map((x) => `  (${q(x.tier)}, ${q(x.name)}, ${q(x.icon_type)}, ${q(x.icon_value)}, ${q(x.proficiency_label)}, ${Number(x.display_order) || 0})`).join(',\n')};

-- 5. SOCIAL LINKS (re-seeding replaces these rows)
DELETE FROM public.social_links;
INSERT INTO public.social_links (name, url, icon, show_hero, show_contact, display_order) VALUES
${d.socials.map((x) => `  (${q(x.name)}, ${q(x.url)}, ${q(x.icon)}, ${bool(x.show_hero)}, ${bool(x.show_contact)}, ${Number(x.display_order) || 0})`).join(',\n')};

-- ==============================================================================
-- CREATE THE ADMIN LINK (run ONCE after creating your user in Supabase -> Authentication):
--   INSERT INTO public.admin_users (id, email, role)
--   VALUES ('<USER_UUID_FROM_AUTH_USERS>', '<your admin email>', 'admin') ON CONFLICT (id) DO NOTHING;
-- ==============================================================================
`;
fs.writeFileSync(path.join(root, 'supabase/seed.sql'), sql);
console.log('supabase/seed.sql generated:', sql.length, 'bytes');
