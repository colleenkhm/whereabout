-- Country's own-language common names from mledoze/countries, keyed by
-- English language name, e.g. {"Dutch": "België", "French": "Belgique"}.
alter table country_facts add column if not exists native_names jsonb;
