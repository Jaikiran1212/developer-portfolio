-- ==============================================================================
-- FIX: "Could not find the 'logo_config' column of 'profile' in the schema cache"
-- The admin Brand Logo feature saves into profile.logo_config, but the original
-- schema never created that column. Run this ONCE in the Supabase SQL editor.
-- Safe to run more than once.
-- ==============================================================================
ALTER TABLE public.profile
  ADD COLUMN IF NOT EXISTS logo_config JSONB NOT NULL
  DEFAULT '{"preset":"hex-ribbon","custom_url":"","primary_color":"#22d3ee","secondary_color":"#8b5cf6"}'::jsonb;

-- Ask Supabase's API (PostgREST) to refresh its schema cache so the new column is visible immediately
NOTIFY pgrst, 'reload schema';
