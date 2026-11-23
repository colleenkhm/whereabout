// Whereabout: country_facts export (ODbL share-alike)
//
// country_facts is adapted from mledoze/countries (ODbL), so ODbL 4.6
// requires offering the adapted table as a free machine-readable download.
// Writes apps/whereabout-web/public/data/country-facts.csv + its license
// notice; the web build ships both. Re-run (and commit) whenever
// country_facts changes.
//
// Run:
//   node export-country-facts.mjs                                 // dev
//   ENV_FILE=.env.scripts.prod node export-country-facts.mjs      // prod, before a release

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
config({ path: process.env.ENV_FILE ?? '.env.scripts', quiet: true });

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const OUT_DIR = 'apps/whereabout-web/public/data';

// Every data column; created_at/updated_at are row bookkeeping, not data.
const COLUMNS = [
  'country_id', 'capital', 'population', 'currency_code', 'currency_name',
  'calling_code', 'official_languages', 'native_names', 'latitude', 'longitude', 'hemisphere',
  'neighbors', 'region', 'subregion', 'timezone', 'flag_svg_url', 'climates',
  'source', 'last_imported_at',
];

const NOTICE = `whereabout country facts (country-facts.csv)

This database is made available under the Open Database License (ODbL) 1.0:
https://opendatacommons.org/licenses/odbl/1-0/

It is a Derivative Database of mledoze/countries
(https://github.com/mledoze/countries), which is made available under the
ODbL. Copyright notices from mledoze/countries apply.

Column sources:
- population: World Bank Open Data (https://data.worldbank.org/),
  CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- timezone: GeoNames (https://www.geonames.org/),
  CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- all other columns: mledoze/countries, with corrections (e.g. retired or
  non-ISO currency codes replaced with the currency travelers actually use)

Arrays and objects are JSON-encoded.
`;

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const { data, error } = await supabase
  .from('country_facts')
  .select(COLUMNS.join(', '))
  .order('country_id');

if (error) {
  console.error('Fetch failed:', error.message);
  process.exit(1);
}

const lines = [COLUMNS.join(','), ...data.map((row) => COLUMNS.map((c) => csvCell(row[c])).join(','))];
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/country-facts.csv`, lines.join('\n') + '\n');
writeFileSync(`${OUT_DIR}/country-facts-license.txt`, NOTICE);
console.log(`Wrote ${data.length} rows to ${OUT_DIR}/country-facts.csv (+ license notice).`);
