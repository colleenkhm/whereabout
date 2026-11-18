// Whereabout: curated data importer
//
// Reads whereabout-data-collection.xlsx and pushes everything real in it
// into Supabase. This is YOUR researched content — nothing here is fetched
// from a third party. Safe to re-run; everything upserts on a stable key.
//
// Several sheets (Categories, Contributors, Regional_Notes) mix real data
// rows with instructional/comment text written into the same columns —
// this script filters those out by checking the key column looks like a
// real slug/code rather than a sentence.
//
// Requires Node 18+ and two packages:
//   npm install @supabase/supabase-js xlsx
//
// Setup (same env vars as the commodity importer):
//   export SUPABASE_URL="https://xxxx.supabase.co"
//   export SUPABASE_SERVICE_ROLE_KEY="ey..."
//   export XLSX_PATH="./whereabout-data-collection.xlsx"   // defaults to cwd
//
// Run:
//   node import-curated-data.mjs                  // everything
//   node import-curated-data.mjs --only=categories,regional_notes,cities,guides,poi,words,phrases,visas,advisories,languages
//
// Order matters on a fresh run: categories before words/phrases (need
// category_id), cities before poi (need city_id), countries must already
// exist (from the commodity importer) before anything here.

import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import { config } from 'dotenv';
config({ path: process.env.ENV_FILE ?? '.env.scripts', quiet: true });

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const XLSX_PATH = process.env.XLSX_PATH || './whereabout-data-collection.xlsx';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.replace('--only=', '').split(',') : null;
const shouldRun = (step) => !only || only.includes(step);

// ---------------------------------------------------------------
// Workbook loading + row-cleaning helpers
// ---------------------------------------------------------------
const workbook = XLSX.readFile(XLSX_PATH);

function sheetRows(sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found in ${XLSX_PATH}`);
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

// Real country/language codes and slugs are short and pattern-shaped.
// Instructional text left in a data cell reads as a long sentence —
// this is enough to reliably tell them apart across every sheet.
const isCountryCode = (v) => typeof v === 'string' && /^[A-Z]{2}$/.test(v);
const isSlug = (v) => typeof v === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(v) && v.length < 60;

// Cache of country iso_code -> Supabase country id, filled on first use.
let countryIdCache = null;
async function getCountryId(isoCode) {
  if (!countryIdCache) {
    const { data, error } = await supabase.from('countries').select('id, iso_code');
    if (error) throw error;
    countryIdCache = new Map(data.map((c) => [c.iso_code, c.id]));
  }
  const id = countryIdCache.get(isoCode);
  if (!id) console.warn(`  No country found for code "${isoCode}" — is the commodity importer's countries table populated?`);
  return id ?? null;
}

// ---------------------------------------------------------------
// Categories (shared across all countries, two-level tree)
// ---------------------------------------------------------------
async function importCategories() {
  console.log('Importing Categories...');
  const rows = sheetRows('Categories').filter((r) => isSlug(r.category_slug));
  console.log(`  ${rows.length} real category rows.`);

  // Pass 1: insert/update without parent (parents must exist before children link to them)
  for (const r of rows) {
    await supabase.from('categories').upsert({
      slug: r.category_slug,
      name: r.name,
      sort_order: r.sort_order ?? 0,
    }, { onConflict: 'slug' });
  }

  // Pass 2: resolve parent_slug -> parent_id
  const { data: allCategories } = await supabase.from('categories').select('id, slug');
  const slugToId = new Map(allCategories.map((c) => [c.slug, c.id]));

  for (const r of rows) {
    if (!r.parent_slug) continue;
    const parentId = slugToId.get(r.parent_slug);
    if (!parentId) {
      console.warn(`  Category "${r.category_slug}" references unknown parent "${r.parent_slug}"`);
      continue;
    }
    await supabase.from('categories').update({ parent_id: parentId }).eq('slug', r.category_slug);
  }
  console.log('  Done.');
}

async function getCategoryIdBySlug(slug) {
  const { data } = await supabase.from('categories').select('id').eq('slug', slug).maybeSingle();
  return data?.id ?? null;
}

// ---------------------------------------------------------------
// Regional notes
// ---------------------------------------------------------------
async function importRegionalNotes() {
  console.log('Importing Regional_Notes...');
  const rows = sheetRows('Regional_Notes').filter((r) => isSlug(r.group_slug));
  console.log(`  ${rows.length} real rows.`);

  for (const r of rows) {
    await supabase.from('regional_notes').upsert({
      group_slug: r.group_slug,
      note_type: r.note_type ?? 'visa',
      summary: r.summary,
      official_url: r.official_url,
      last_verified_at: r.last_verified ? new Date(r.last_verified).toISOString() : null,
    });
  }
  console.log('  Done.');
}

// ---------------------------------------------------------------
// Cities — update is_featured/why_featured on existing rows (from the
// commodity importer); insert any curated city that isn't already there.
// Never touches is_major — that stays importer-owned.
// ---------------------------------------------------------------
const cityKeyToSupabaseId = new Map(); // spreadsheet city_id -> Supabase uuid

async function importCities() {
  console.log('Importing Cities (featured status)...');
  const rows = sheetRows('Cities').filter((r) => isCountryCode(r.country_code));
  console.log(`  ${rows.length} real rows.`);

  for (const r of rows) {
    const countryId = await getCountryId(r.country_code);
    if (!countryId) continue;

    const { data: existing } = await supabase
      .from('cities')
      .select('id')
      .eq('country_id', countryId)
      .ilike('name', r.name)
      .maybeSingle();

    const isFeatured = String(r.is_featured).toUpperCase() === 'TRUE';
    const isMajor = String(r.is_major).toUpperCase() === 'TRUE';

    if (existing) {
      cityKeyToSupabaseId.set(r.city_id, existing.id);
      await supabase.from('cities').update({
        is_featured: isFeatured,
        why_featured: r.why_featured ?? null,
      }).eq('id', existing.id);
    } else {
      // Not already imported by the commodity script (e.g. outside GeoNames'
      // top-N by population) — insert it fresh, curated fields included.
      const { data: inserted, error } = await supabase.from('cities').insert({
        country_id: countryId,
        name: r.name,
        population: r.population ?? null,
        latitude: r.latitude ?? null,
        longitude: r.longitude ?? null,
        is_major: isMajor,
        is_featured: isFeatured,
        why_featured: r.why_featured ?? null,
      }).select('id').single();
      if (error) { console.warn(`  Failed inserting city ${r.name}:`, error.message); continue; }
      cityKeyToSupabaseId.set(r.city_id, inserted.id);
    }
  }
  console.log('  Done.');
}

// Resolve a spreadsheet city_id ("gr-athens") to a Supabase city uuid,
// building the map on demand if importCities() wasn't run this session.
async function resolveCityId(spreadsheetCityId) {
  if (!spreadsheetCityId) return null;
  if (cityKeyToSupabaseId.has(spreadsheetCityId)) return cityKeyToSupabaseId.get(spreadsheetCityId);

  const cityRows = sheetRows('Cities').filter((r) => isCountryCode(r.country_code));
  const match = cityRows.find((r) => r.city_id === spreadsheetCityId);
  if (!match) return null;

  const countryId = await getCountryId(match.country_code);
  if (!countryId) return null;

  const { data } = await supabase
    .from('cities')
    .select('id')
    .eq('country_id', countryId)
    .ilike('name', match.name)
    .maybeSingle();

  if (data) cityKeyToSupabaseId.set(spreadsheetCityId, data.id);
  return data?.id ?? null;
}

// ---------------------------------------------------------------
// Guide_Items -> country_guides (aggregated JSONB per country)
// ---------------------------------------------------------------
function guideItemToEntry(row) {
  switch (row.item_type) {
    case 'best_time':
      return { bucket: 'best_times', entry: {
        months: row.months, why: row.body, why_short: row.title, crowd_level: row.crowd_level ?? null,
      } };
    case 'tipping_norm':
    case 'punctuality_norm':
    case 'transport_norm':
      return { bucket: 'practical_norms', entry: {
        type: row.item_type, title: row.title, body: row.body, severity: row.severity_or_urgency ?? 'fyi',
      } };
    case 'cuisine':
      return { bucket: 'cuisine_notes', entry: {
        dish: row.title, description: row.body, where: row.applies_to ?? null, dietary_flags: [],
      } };
    case 'festival':
      return { bucket: 'festivals', entry: { title: row.title, body: row.body, months: row.months } };
    case 'prep':
      return { bucket: 'prep_notes', entry: {
        title: row.title, body: row.body, urgency: row.severity_or_urgency ?? 'recommended',
      } };
    case 'dress':
      return { bucket: 'dress_expectations', entry: {
        context: row.title, expectation: row.body, applies_to: row.applies_to ?? null,
      } };
    case 'history':
      return { bucket: 'historical_events', entry: { title: row.title, why_it_matters: row.body } };
    default:
      return null;
  }
}

async function importGuideItems() {
  console.log('Importing Guide_Items...');
  const rows = sheetRows('Guide_Items').filter((r) => isCountryCode(r.country_code));
  console.log(`  ${rows.length} real rows.`);

  const byCountry = new Map();
  for (const r of rows) {
    if (!byCountry.has(r.country_code)) byCountry.set(r.country_code, []);
    byCountry.get(r.country_code).push(r);
  }

  for (const [countryCode, countryRows] of byCountry) {
    const countryId = await getCountryId(countryCode);
    if (!countryId) continue;

    const buckets = {
      best_times: [], practical_norms: [], dress_expectations: [],
      cuisine_notes: [], historical_events: [], festivals: [], prep_notes: [],
    };
    for (const row of countryRows) {
      const mapped = guideItemToEntry(row);
      if (mapped) buckets[mapped.bucket].push(mapped.entry);
    }

    await supabase.from('country_guides').upsert({
      country_id: countryId,
      ...buckets,
      last_reviewed_at: new Date().toISOString(),
    }, { onConflict: 'country_id' });
  }
  console.log('  Done.');
}

// ---------------------------------------------------------------
// Explore -> points_of_interest
// ---------------------------------------------------------------
async function importPointsOfInterest() {
  console.log('Importing Explore (points_of_interest)...');
  const rows = sheetRows('Explore').filter((r) => isCountryCode(r.country_code));
  console.log(`  ${rows.length} real rows.`);

  for (const r of rows) {
    const countryId = await getCountryId(r.country_code);
    if (!countryId) continue;
    const cityId = await resolveCityId(r.city_id);

    await supabase.from('points_of_interest').upsert({
      country_id: countryId,
      city_id: cityId,
      poi_type: r.poi_type,
      tags: r.tags ?? null,
      name: r.name,
      description: r.description,
      dress_code: r.dress_code ?? null,
      visit_notes: r.visit_notes ?? null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
    });
  }
  console.log('  Done.');
}

// ---------------------------------------------------------------
// Languages (auto-created from whatever language_code appears) + Words
// ---------------------------------------------------------------
const LANGUAGE_NAMES = { fr: 'French', el: 'Greek', de: 'German', pt: 'Portuguese', en: 'English', es: 'Spanish' };
const DIFFICULTY_MAP = { beginner: 1, elementary: 1, intermediate: 2, advanced: 3, expert: 4 };

function toDifficultyInt(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return value;
  const mapped = DIFFICULTY_MAP[String(value).trim().toLowerCase()];
  if (mapped == null) console.warn(`  Unrecognized difficulty "${value}" — storing as null.`);
  return mapped ?? null;
}

let languageIdCache = null;

async function getLanguageId(isoCode, name = null) {
  if (!languageIdCache) languageIdCache = new Map();
  if (languageIdCache.has(isoCode)) return languageIdCache.get(isoCode);

  const { data: existing } = await supabase.from('languages').select('id').eq('iso_code', isoCode).maybeSingle();
  if (existing) { languageIdCache.set(isoCode, existing.id); return existing.id; }

  const { data: inserted, error } = await supabase.from('languages')
    .insert({ iso_code: isoCode, name: name ?? LANGUAGE_NAMES[isoCode] ?? isoCode })
    .select('id').single();
  if (error) throw error;
  languageIdCache.set(isoCode, inserted.id);
  return inserted.id;
}

async function importWords() {
  console.log('Importing Words...');
  const rows = sheetRows('Words').filter((r) => isCountryCode(r.country_code));
  console.log(`  ${rows.length} real rows.`);

  for (const r of rows) {
    const countryId = await getCountryId(r.country_code);
    if (!countryId) continue;
    const languageId = await getLanguageId(r.language_code);

    const { data: word, error } = await supabase.from('words').insert({
      country_id: countryId,
      language_id: languageId,
      lemma: r.lemma,
      translation: r.translation,
      part_of_speech: r.part_of_speech ?? null,
      gender: r.gender ?? null,
      pronunciation: r.pronunciation ?? null,
      ipa: r.ipa ?? null,
      usage_note: r.usage_note ?? null,
      difficulty: toDifficultyInt(r.difficulty),
    }).select('id').single();
    if (error) { console.warn(`  Failed on word "${r.lemma}":`, error.message); continue; }

    const slugs = (r.category_slugs ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const slug of slugs) {
      const categoryId = await getCategoryIdBySlug(slug);
      if (categoryId) await supabase.from('word_categories').insert({ word_id: word.id, category_id: categoryId });
    }
  }
  console.log('  Done.');
}

// ---------------------------------------------------------------
// Phrases -> phrases + auto-tokenized phrase_tokens
// ---------------------------------------------------------------
function tokenize(text, maskableWords) {
  // Split into words and punctuation as separate tokens.
  const maskableSet = new Set(
    (maskableWords ?? '').split(',').map((w) => w.trim().toLowerCase()).filter(Boolean)
  );
  const matches = text.match(/[\p{L}\p{N}'’-]+|[^\s\p{L}\p{N}]+/gu) ?? [];
  return matches.map((surfaceForm, i) => {
    const isPunctuation = /^[^\p{L}\p{N}]+$/u.test(surfaceForm);
    return {
      position: i,
      surface_form: surfaceForm,
      is_maskable: !isPunctuation && maskableSet.has(surfaceForm.toLowerCase()),
      token_type: isPunctuation ? 'punctuation' : 'word',
    };
  });
}

async function importPhrases() {
  console.log('Importing Phrases...');
  const rows = sheetRows('Phrases').filter((r) => isCountryCode(r.country_code));
  console.log(`  ${rows.length} real rows.`);

  for (const r of rows) {
    const countryId = await getCountryId(r.country_code);
    if (!countryId) continue;
    const languageId = await getLanguageId(r.language_code);
    const categoryId = r.category_slug ? await getCategoryIdBySlug(r.category_slug) : null;

    const { data: phrase, error } = await supabase.from('phrases').insert({
      country_id: countryId,
      language_id: languageId,
      category_id: categoryId,
      text: r.text,
      translation: r.translation,
      literal_translation: r.literal_translation ?? null,
      pronunciation: r.pronunciation ?? null,
      formality: r.formality ?? null,
      usage_note: r.usage_note ?? null,
      sort_order: r.sort_order ?? 0,
    }).select('id').single();
    if (error) { console.warn(`  Failed on phrase "${r.text}":`, error.message); continue; }

    const tokens = tokenize(r.text, r.maskable_words);
    for (const t of tokens) {
      await supabase.from('phrase_tokens').insert({ phrase_id: phrase.id, ...t });
    }
  }
  console.log('  Done. Tokens auto-split on whitespace/punctuation — hand-check word_id links and is_maskable flags in the admin UI, per your architecture doc.');
}

// ---------------------------------------------------------------
// Visas -> visa_requirements
// ---------------------------------------------------------------
async function importVisas() {
  console.log('Importing Visas...');
  const rows = sheetRows('Visas').filter((r) => isCountryCode(r.destination_country_code));
  console.log(`  ${rows.length} real rows.`);

  for (const r of rows) {
    const destId = await getCountryId(r.destination_country_code);
    const natId = await getCountryId(r.nationality_country_code);
    if (!destId || !natId) continue;
    if (!r.official_url || !r.last_verified) {
      console.warn(`  Skipping visa row for ${r.destination_country_code}: missing required official_url/last_verified.`);
      continue;
    }

    await supabase.from('visa_requirements').insert({
      destination_country_id: destId,
      nationality_country_id: natId,
      summary: r.summary,
      official_url: r.official_url,
      application_url: r.application_url ?? null,
      last_verified_at: new Date(r.last_verified).toISOString(),
      prohibited_on_entry: r.prohibited_on_entry ?? null,
      prohibited_on_exit: r.prohibited_on_exit ?? null,
    });
  }
  console.log('  Done.');
}

// ---------------------------------------------------------------
// Advisories -> travel_advisories
// ---------------------------------------------------------------
async function importAdvisories() {
  console.log('Importing Advisories...');
  const rows = sheetRows('Advisories').filter((r) => isCountryCode(r.country_code));
  console.log(`  ${rows.length} real rows.`);

  for (const r of rows) {
    const countryId = await getCountryId(r.country_code);
    if (!countryId) continue;
    if (!r.official_url || !r.last_verified) {
      console.warn(`  Skipping advisory row for ${r.country_code}: missing required official_url/last_verified.`);
      continue;
    }

    await supabase.from('travel_advisories').insert({
      country_id: countryId,
      issuing_authority: r.issuing_authority,
      level: r.level ?? null,
      level_label: r.level_label ?? null,
      summary: r.summary ?? null,
      official_url: r.official_url,
      issued_at: r.issued_date ? new Date(r.issued_date).toISOString().slice(0, 10) : null,
      last_verified_at: new Date(r.last_verified).toISOString(),
    });
  }
  console.log('  Done.');
}

// ---------------------------------------------------------------
// Languages (per-country speaker percentages + verification state)
// ---------------------------------------------------------------
// Only percent fields, is_official and display_rank are written; usage_note/is_primary
// stay as hand-set in Supabase. See migration 030 for the status values.
const PERCENT_STATUSES = new Set(['verified', 'unverified', 'no_source', 'needs_research']);

async function importLanguages() {
  console.log('Importing Languages...');
  const rows = sheetRows('Languages').filter(
    (r) => isCountryCode(r.country_code) && typeof r.language_code === 'string' && r.notes !== 'example row — delete or skip',
  );
  console.log(`  ${rows.length} real rows.`);
  let skipped = 0;
  for (const r of rows) {
    const where = `${r.country_code}/${r.language_code}`;
    const status = r.status ?? 'needs_research';
    const percent = typeof r.percent_speakers === 'number' ? r.percent_speakers : null;
    if (!PERCENT_STATUSES.has(status)) { console.warn(`  ${where}: unknown status "${status}", skipped.`); skipped++; continue; }
    if (status === 'verified' && (percent === null || !r.percent_year || !r.source_url)) {
      console.warn(`  ${where}: verified needs percent_speakers, percent_year and source_url, skipped.`); skipped++; continue;
    }
    if ((status === 'no_source' || status === 'needs_research') && percent !== null) {
      console.warn(`  ${where}: has a figure but status ${status}, skipped.`); skipped++; continue;
    }

    const countryId = await getCountryId(r.country_code);
    if (!countryId) { skipped++; continue; }
    const languageId = await getLanguageId(r.language_code, r.language_name);
    const fields = {
      percent_speakers: percent,
      percent_status: status,
      percent_year: r.percent_year ?? null,
      percent_source_url: r.source_url ?? null,
      percent_speakers_source: r.source_citation ?? null,
      ...(typeof r.is_official === 'boolean' ? { is_official: r.is_official } : {}),
      ...(r.display_rank !== undefined ? { display_rank: typeof r.display_rank === 'number' ? r.display_rank : null } : {}),
    };

    const { data: updated, error } = await supabase.from('country_languages')
      .update(fields).eq('country_id', countryId).eq('language_id', languageId).select('country_id');
    if (error) throw error;
    if (updated.length === 0) {
      const { error: insertError } = await supabase.from('country_languages')
        .insert({ country_id: countryId, language_id: languageId, is_primary: false, is_official: false, ...fields });
      if (insertError) throw insertError;
    }
  }
  console.log(`  Done.${skipped ? ` ${skipped} rows skipped (see warnings).` : ''}`);
}

// ---------------------------------------------------------------
async function main() {
  console.log(`Reading ${XLSX_PATH}...`);

  if (shouldRun('categories')) await importCategories();
  if (shouldRun('regional_notes')) await importRegionalNotes();
  if (shouldRun('cities')) await importCities();
  if (shouldRun('guides')) await importGuideItems();
  if (shouldRun('poi')) await importPointsOfInterest();
  if (shouldRun('words')) await importWords();
  if (shouldRun('phrases')) await importPhrases();
  if (shouldRun('visas')) await importVisas();
  if (shouldRun('advisories')) await importAdvisories();
  if (shouldRun('languages')) await importLanguages();

  console.log('\nDone. Note: Contributors sheet had no real rows yet (only instructional text) — nothing to import there.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
