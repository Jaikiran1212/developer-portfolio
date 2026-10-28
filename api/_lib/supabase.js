// ==============================================================================
// SUPABASE CLIENT INITIALIZATION & RESILIENT FALLBACK PROVIDER
// ==============================================================================
import { createClient } from '@supabase/supabase-js';
import seed from '../../data/portfolio.json' with { type: 'json' };
import { adminEmails } from './env.js';

function normalizeConfig(rawUrl, rawAnon, rawService) {
  let url = (rawUrl || '').trim().replace(/^["']|["']$/g, '').trim();
  let anon = (rawAnon || '').trim().replace(/^["']|["']$/g, '').trim();
  let service = (rawService || '').trim().replace(/^["']|["']$/g, '').trim();

  // Handle accidental swap of URL and Key
  if (url.startsWith('eyJ') && (anon.startsWith('http') || anon.includes('.supabase.co'))) {
    const temp = url;
    url = anon;
    anon = temp;
  }

  if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    try {
      const parsed = new URL(url);
      url = parsed.origin;
    } catch (_) {
      url = url.replace(/\/+(auth|rest)(\/v\d+)?\/?$/i, '').replace(/\/+$/, '');
    }
  }

  return { url, anon, service };
}

const config = normalizeConfig(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const SUPABASE_URL = config.url;
export const SUPABASE_ANON_KEY = config.anon;
export const SUPABASE_SERVICE_KEY = config.service;

export const hasSupabaseConfig = Boolean(SUPABASE_URL && (SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY));

// Initialize standard Supabase client with cleaned URL
export const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  : null;

// ==============================================================================
// IN-MEMORY STORE - LOCAL DEVELOPMENT / TESTS ONLY.
// Built from data/portfolio.json (the single source of truth for default content).
// Production never writes here: contact/CMS endpoints return 503 instead (see contact.js, auth.js).
// ==============================================================================
const now = () => new Date().toISOString();
const stamp = (o) => ({ ...o, created_at: now(), updated_at: now() });

export const memoryStore = {
  profile: { id: 1, ...structuredClone(seed.profile), updated_at: now() },
  projects: seed.projects.map((p) => stamp(structuredClone(p))),
  experience: seed.experience.map((x) => stamp(structuredClone(x))),
  skills: seed.skills.map((s) => stamp(structuredClone(s))),
  socials: seed.socials.map((s) => ({ ...structuredClone(s), created_at: now() })),
  messages: [],
  audit_logs: [],
  admin_users: adminEmails().map((email, i) => ({
    id: `00000000-0000-0000-0000-00000000000${i + 1}`,
    email,
    role: 'admin',
    created_at: now(),
  })),
};
