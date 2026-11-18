-- Whereabout: Indonesia's best_times are also the 2026-09-02 draft, but its
-- last_reviewed_at (from an earlier import) let it slip past 040.
update country_guides
set best_times = '[]'::jsonb
where country_id = 'ID'
  and best_times = '[{"why": "dry season, best overall, lower rainfall/humidity", "months": "May,June,July,August,September", "why_short": "dry season", "crowd_level": "moderate"}]'::jsonb;
