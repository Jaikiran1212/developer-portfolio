// ==============================================================================
// PUBLIC PORTFOLIO ENDPOINT (GET /api/portfolio)
// Returns public, published portfolio data in an aggregated response
// ==============================================================================
import { supabase, hasSupabaseConfig, memoryStore } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set caching headers for fast delivery with stale-while-revalidate
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  if (hasSupabaseConfig && supabase) {
    try {
      const [
        { data: profile, error: pErr },
        { data: projects, error: prErr },
        { data: experience, error: expErr },
        { data: skills, error: skErr },
        { data: socials, error: socErr },
      ] = await Promise.all([
        supabase.from('profile').select('*').eq('id', 1).maybeSingle(),
        supabase.from('projects').select('*').eq('published', true).order('display_order', { ascending: true }),
        supabase.from('experience').select('*').eq('published', true).order('display_order', { ascending: true }),
        supabase.from('skills').select('*').order('display_order', { ascending: true }),
        supabase.from('social_links').select('*').order('display_order', { ascending: true }),
      ]);

      if (pErr || prErr || expErr || skErr || socErr) {
        console.error('Supabase query error:', { pErr, prErr, expErr, skErr, socErr });
        // Fall back gracefully to memory store if query failed
        res.setHeader('Cache-Control', 'no-store'); // never cache fallback/seed data
        return res.status(200).json({
          profile: memoryStore.profile,
          projects: memoryStore.projects.filter((p) => p.published),
          experience: memoryStore.experience.filter((e) => e.published),
          skills: memoryStore.skills,
          socials: memoryStore.socials,
          source: 'fallback',
        });
      }

      return res.status(200).json({
        profile: profile || memoryStore.profile,
        projects: projects || [],
        experience: experience || [],
        skills: skills || [],
        socials: socials || [],
        source: 'database',
      });
    } catch (err) {
      console.error('Portfolio handler exception:', err);
      res.setHeader('Cache-Control', 'no-store'); // never cache fallback/seed data
      return res.status(200).json({
        profile: memoryStore.profile,
        projects: memoryStore.projects.filter((p) => p.published),
        experience: memoryStore.experience.filter((e) => e.published),
        skills: memoryStore.skills,
        socials: memoryStore.socials,
        source: 'fallback',
      });
    }
  }

  // Fallback mode for local dev or offline
  res.setHeader('Cache-Control', 'no-store'); // never cache fallback/seed data
  return res.status(200).json({
    profile: memoryStore.profile,
    projects: memoryStore.projects.filter((p) => p.published),
    experience: memoryStore.experience.filter((e) => e.published),
    skills: memoryStore.skills,
    socials: memoryStore.socials,
    source: 'memory',
  });
}
