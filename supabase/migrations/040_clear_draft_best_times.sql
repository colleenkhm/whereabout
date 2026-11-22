-- Whereabout: clear best_times that came straight from the 2026-09-02
-- research draft (research_drafts/best_times/), never rewritten. Draft rows
-- are the ones with no last_reviewed_at; the spreadsheet importer always
-- sets it. Hand-written entries (BR, CA, DE, GR, IE) are untouched.
update country_guides
set best_times = '[]'::jsonb
where last_reviewed_at is null
  and best_times <> '[]'::jsonb;
