// Whereabout: commodity data importer
//
// Fills country_facts and cities for ALL countries — entirely from free,
// no-account, no-key sources:
//   - names, capital, currency, calling code, languages, lat/lng,
//     region/subregion, borders  -> mledoze/countries (static JSON on GitHub,
//     ODbL licensed: storing is fine, but needs attribution and stays
//     share-alike — credited on the About screen)
//   - population                 -> World Bank Open Data API (free, no key, CC BY 4.0)
//   - cities                     -> GeoNames (free account, CC BY 4.0)
//
// Flags are intentionally NOT touched here — handled elsewhere in the app already.
//
// Requires Node 18+ (built-in fetch) and @supabase/supabase-js.
//
// Setup:
//   npm install @supabase/supabase-js
//   export SUPABASE_URL="https://xxxx.supabase.co"
//   export SUPABASE_SERVICE_ROLE_KEY="ey..."     // service_role, NOT anon — bypasses RLS
//   export GEONAMES_USERNAME="your_geonames_username"  // free account at geonames.org
//
// Run:
//   node import-commodity-data.mjs              // both steps
//   node import-commodity-data.mjs --facts-only // skip GeoNames
//   node import-commodity-data.mjs --cities-only

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: process.env.ENV_FILE ?? '.env.scripts', quiet: true });

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEONAMES_USERNAME = process.env.GEONAMES_USERNAME;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL)) {
  console.warn(
    `Warning: SUPABASE_URL doesn't look like the expected shape ` +
    `(https://xxxx.supabase.co). Got: "${SUPABASE_URL}". ` +
    `Double-check it doesn't have a trailing path or extra segments.`
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const args = process.argv.slice(2);
const factsOnly = args.includes('--facts-only');
const citiesOnly = args.includes('--cities-only');
const timezonesOnly = args.includes('--timezones-only');
const shouldImportTimezones = !args.includes('--skip-timezones');

const CITIES_PER_COUNTRY = 5; // top N by population, mirrors is_major cutoff

// mledoze lists a defunct, non-ISO, or wrong currency first for these.
// Mirrors migrations 031/033.
const CURRENCY_OVERRIDES = {
  CU: ['CUP', 'Cuban peso'],             // CUC retired January 2021
  CK: ['NZD', 'New Zealand dollar'],     // CKD isn't ISO; pegged 1:1 to NZD
  ZW: ['ZWG', 'Zimbabwe Gold'],          // ZWG since April 2024
  PS: ['ILS', 'Israeli new shekel'],     // primary under the Paris Protocol
  EH: ['MAD', 'Moroccan dirham'],        // Moroccan-administered areas
};

// Centroid sits in open ocean, so GeoNames returns no zone. Mirrors
// migration 032. BV and HM are uninhabited with no IANA zone.
const TIMEZONE_OVERRIDES = {
  AS: 'Pacific/Pago_Pago',
  BS: 'America/Nassau',
  CC: 'Indian/Cocos',
  CV: 'Atlantic/Cape_Verde',
  FJ: 'Pacific/Fiji',
  KY: 'America/Cayman',
  MF: 'America/Marigot',
  MH: 'Pacific/Majuro',
  PF: 'Pacific/Tahiti',                  // Papeete; Marquesas/Gambier differ
  SJ: 'Arctic/Longyearbyen',
  ST: 'Africa/Sao_Tome',
  TV: 'Pacific/Funafuti',
  VU: 'Pacific/Efate',
};

// ---------------------------------------------------------------
// Step 1: countries + country_facts
// ---------------------------------------------------------------
async function importCountryFacts() {
  console.log('Fetching mledoze/countries (names, capital, currency, geography)...');
  const countriesRes = await fetch(
    'https://raw.githubusercontent.com/mledoze/countries/master/countries.json'
  );
  if (!countriesRes.ok) throw new Error(`mledoze/countries fetch failed: ${countriesRes.status}`);
  const countries = await countriesRes.json();
  if (!Array.isArray(countries)) throw new Error('mledoze/countries did not return an array.');
  console.log(`Got ${countries.length} countries.`);

  console.log('Fetching World Bank population data...');
  const popRes = await fetch(
    'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=300&mrnev=1'
  );
  if (!popRes.ok) throw new Error(`World Bank fetch failed: ${popRes.status}`);
  const popJson = await popRes.json();
  const popRows = Array.isArray(popJson) ? popJson[1] ?? [] : [];
  // Keyed by cca3 (World Bank calls it countryiso3code)
  const populationByCca3 = new Map(
    popRows
      .filter((r) => r.value != null && r.countryiso3code)
      .map((r) => [r.countryiso3code, r.value])
  );
  console.log(`Got population for ${populationByCca3.size} countries.`);

  // mledoze's `borders` field lists neighbors by cca3 — build the map to
  // translate to our iso_code (cca2) join key.
  const cca3ToCca2 = new Map(countries.map((c) => [c.cca3, c.cca2]));

  let ok = 0, failed = 0;

  for (const c of countries) {
    const isoCode = c.cca2;
    if (!isoCode) { failed++; continue; }

    try {
      const { data: existing } = await supabase
        .from('countries')
        .select('id')
        .eq('iso_code', isoCode)
        .maybeSingle();

      let countryId;
      if (existing) {
        countryId = existing.id;
        await supabase
          .from('countries')
          .update({
            name_common: c.name?.common ?? null,
            name_official: c.name?.official ?? null,
          })
          .eq('id', countryId);
      } else {
        const { data: inserted, error } = await supabase
          .from('countries')
          .insert({
            iso_code: isoCode,
            name_common: c.name?.common ?? isoCode,
            name_official: c.name?.official ?? null,
            is_published: false,
            content_status: 'none',
          })
          .select('id')
          .single();
        if (error) throw error;
        countryId = inserted.id;
      }

      const firstCurrency = c.currencies ? Object.keys(c.currencies)[0] : null;
      const [currencyCode, currencyName] = CURRENCY_OVERRIDES[isoCode] ??
        [firstCurrency, firstCurrency ? c.currencies[firstCurrency]?.name ?? null : null];
      const callingCode = c.idd?.root
        ? `${c.idd.root}${c.idd.suffixes?.[0] ?? ''}`
        : null;

      const latitude = c.latlng?.[0] ?? null;
      const hemisphere = latitude == null ? null : latitude > 0 ? 'Northern' : latitude < 0 ? 'Southern' : null;

      const neighbors = (c.borders ?? [])
        .map((cca3) => cca3ToCca2.get(cca3))
        .filter(Boolean);

      const population = populationByCca3.get(c.cca3) ?? null;

      // Guard against clobbering hand-edited facts: if this row's source
      // has been changed away from the importer's own value (e.g. to
      // 'manual'), skip it. Set country_facts.source = 'manual' after any
      // hand edit in the Table Editor to protect it from future re-imports.
      const { data: existingFacts } = await supabase
        .from('country_facts')
        .select('source')
        .eq('country_id', countryId)
        .maybeSingle();

      if (existingFacts && existingFacts.source && existingFacts.source !== 'mledoze+worldbank') {
        console.log(`  Skipping ${isoCode}: country_facts.source = "${existingFacts.source}" (manually edited, not overwriting)`);
        ok++;
        continue;
      }

      const { error: factsError } = await supabase
        .from('country_facts')
        .upsert({
          country_id: countryId,
          capital: c.capital?.[0] ?? null,
          population,
          currency_code: currencyCode,
          currency_name: currencyName,
          calling_code: callingCode,
          official_languages: c.languages ?? {},
          // Keyed by English language name to match country_languages.
          native_names: Object.fromEntries(
            Object.entries(c.name?.native ?? {}).map(([code, n]) => [c.languages?.[code] ?? code, n.common]),
          ),
          latitude,
          longitude: c.latlng?.[1] ?? null,
          hemisphere,
          neighbors,
          region: c.region ?? null,
          subregion: c.subregion ?? null,
          source: 'mledoze+worldbank',
          last_imported_at: new Date().toISOString(),
        }, { onConflict: 'country_id' });

      if (factsError) throw factsError;
      ok++;
    } catch (err) {
      console.error(`  Failed on ${isoCode}:`, err.message);
      failed++;
    }
  }

  console.log(`country_facts: ${ok} upserted, ${failed} failed.`);
}

// ---------------------------------------------------------------
// Step 2: cities from GeoNames (top N by population per country)
// ---------------------------------------------------------------
async function importCities() {
  if (!GEONAMES_USERNAME) {
    console.warn('No GEONAMES_USERNAME set — skipping city import. Sign up free at geonames.org/login.');
    return;
  }

  console.log('Fetching countries to import cities for...');
  const { data: countries, error } = await supabase
    .from('countries')
    .select('id, iso_code');
  if (error) throw error;

  let ok = 0, failed = 0;
  const FETCH_TIMEOUT_MS = 10_000;

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    process.stdout.write(`  [${i + 1}/${countries.length}] ${country.iso_code}... `);
    try {
      const url = `http://api.geonames.org/searchJSON?country=${country.iso_code}` +
        `&featureClass=P&orderby=population&maxRows=${CITIES_PER_COUNTRY}` +
        `&username=${GEONAMES_USERNAME}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let res;
      try {
        res = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      if (!res.ok) throw new Error(`GeoNames fetch failed: ${res.status}`);
      const json = await res.json();

      if (json.status) {
        throw new Error(json.status.message ?? 'GeoNames error');
      }

      const cities = (json.geonames ?? []).filter((g) => g.population > 0);

      for (const g of cities) {
        const { data: existingCity } = await supabase
          .from('cities')
          .select('id')
          .eq('country_id', country.id)
          .eq('name', g.name)
          .maybeSingle();

        const payload = {
          country_id: country.id,
          name: g.name,
          population: g.population,
          latitude: parseFloat(g.lat),
          longitude: parseFloat(g.lng),
          is_major: true,
        };

        if (existingCity) {
          await supabase.from('cities').update(payload).eq('id', existingCity.id);
        } else {
          await supabase.from('cities').insert(payload); // is_featured defaults false
        }
      }
      console.log(`${cities.length} cities`);
      ok++;
      // GeoNames free tier: be polite, ~1 req/sec ceiling.
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      const reason = err.name === 'AbortError' ? `timed out after ${FETCH_TIMEOUT_MS}ms` : err.message;
      console.log(`FAILED (${reason})`);
      failed++;
    }
  }

  console.log(`cities: ${ok} countries processed, ${failed} failed.`);
}

async function importTimezones() {
  if (!GEONAMES_USERNAME) {
    console.warn('No GEONAMES_USERNAME set — skipping timezone import.');
    return;
  }

  console.log('Fetching countries to import timezones for...');
  const { data: countries, error } = await supabase
    .from('countries')
    .select('id, iso_code');
  if (error) throw error;

  const { data: facts } = await supabase
    .from('country_facts')
    .select('country_id, latitude, longitude, source');
  const factsById = new Map(facts.map((f) => [f.country_id, f]));

  let ok = 0, failed = 0, skipped = 0;
  const FETCH_TIMEOUT_MS = 10_000;

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    const fact = factsById.get(country.id);

    if (fact && fact.source && fact.source !== 'mledoze+worldbank') {
      console.log(`  [${i + 1}/${countries.length}] ${country.iso_code}... skipped (manually edited)`);
      skipped++;
      continue;
    }
    const override = TIMEZONE_OVERRIDES[country.iso_code];
    if (override) {
      await supabase.from('country_facts').update({ timezone: override }).eq('country_id', country.id);
      console.log(`  [${i + 1}/${countries.length}] ${country.iso_code}... ${override} (override)`);
      ok++;
      continue;
    }
    if (!fact || fact.latitude == null || fact.longitude == null) {
      console.log(`  [${i + 1}/${countries.length}] ${country.iso_code}... skipped (no lat/lng)`);
      skipped++;
      continue;
    }

    process.stdout.write(`  [${i + 1}/${countries.length}] ${country.iso_code}... `);
    try {
      const url = `http://api.geonames.org/timezoneJSON?lat=${fact.latitude}&lng=${fact.longitude}&username=${GEONAMES_USERNAME}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let res;
      try {
        res = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      if (!res.ok) throw new Error(`GeoNames fetch failed: ${res.status}`);
      const json = await res.json();
      if (json.status) throw new Error(json.status.message ?? 'GeoNames error');

      const timezoneId = json.timezoneId ?? null;
      if (!timezoneId) throw new Error('No timezoneId in response');

      await supabase.from('country_facts').update({ timezone: timezoneId }).eq('country_id', country.id);
      console.log(timezoneId);
      ok++;
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      const reason = err.name === 'AbortError' ? `timed out after ${FETCH_TIMEOUT_MS}ms` : err.message;
      console.log(`FAILED (${reason})`);
      failed++;
    }
  }

  console.log(`timezones: ${ok} updated, ${skipped} skipped, ${failed} failed.`);
}

// ---------------------------------------------------------------
async function main() {
  if (!citiesOnly && !timezonesOnly) await importCountryFacts();
  if (!factsOnly && !timezonesOnly) await importCities();
  if (shouldImportTimezones || timezonesOnly) await importTimezones();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
