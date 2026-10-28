-- ==============================================================================
-- ONE-OFF REPAIR: undo HTML entities that the old server saved into text columns
-- (e.g. "Knuth&#x27;s" -> "Knuth's"). Safe to run more than once. Run in Supabase SQL editor.
-- Order matters: &amp; is decoded LAST so "&amp;#x27;" becomes "&#x27;" and then "'" on a 2nd pass.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public._jk_unescape(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT replace(replace(replace(replace(replace(replace(coalesce(t,''),
    '&#x27;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&#39;', ''''), '&amp;', '&')
$$;

-- run each statement twice if you saved the same text several times (double/triple escaping)
UPDATE public.projects SET title=_jk_unescape(title), short_desc=_jk_unescape(short_desc), problem_statement=_jk_unescape(problem_statement),
  solution=_jk_unescape(solution), architecture=_jk_unescape(architecture), my_contribution=_jk_unescape(my_contribution),
  challenges=_jk_unescape(challenges), measurable_results=_jk_unescape(measurable_results);
UPDATE public.experience SET organization=_jk_unescape(organization), role_title=_jk_unescape(role_title), duration=_jk_unescape(duration);
UPDATE public.skills SET name=_jk_unescape(name);
UPDATE public.social_links SET name=_jk_unescape(name);
UPDATE public.profile SET greet=_jk_unescape(greet), name=_jk_unescape(name), lead_bio=_jk_unescape(lead_bio), location=_jk_unescape(location);
UPDATE public.messages SET name=_jk_unescape(name), subject=_jk_unescape(subject), message=_jk_unescape(message);
-- Optional: shorten the long skill label
UPDATE public.skills SET name='IAM' WHERE name LIKE 'IAM (%';
