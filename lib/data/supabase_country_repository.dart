import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/country_bundle.dart';
import '../models/country_guide.dart';
import '../models/travel_info.dart';
import '../models/language_content.dart';

/// Fetches a [CountryBundle] from the real Supabase backend. Returns
/// `null` only if the country has no Supabase row at all — otherwise
/// returns whatever exists, even if that's commodity facts only (no
/// curated guide/advisories/visa/words yet). The caller decides how to
/// weigh that against a local mock bundle — see
/// `CountryHeaderPreviewScreen._load()`.
///
/// First pass — only fetches what the accordion UI actually renders today
/// (facts, cities, best times, practical norms, US advisories/visa,
/// country_languages, one featured word). Points of interest, tips,
/// phrases, categories aren't shown anywhere yet, so they're left empty
/// rather than fetched unused. See HANDOFF.md for the full list of what's
/// not wired yet.
// Keep in sync with STALE_AFTER_DAYS in refresh-country-state-dept.
const stateDeptStaleAfter = Duration(days: 30);

class SupabaseCountryRepository {
  SupabaseClient get _client => Supabase.instance.client;

  // One request: country row plus every related table embedded.
  Future<CountryBundle?> fetchCountryBundle(String isoCode, {String passportIso = 'US'}) async {
    var countryRow = await _fetchCountryRow(isoCode, passportIso);
    if (countryRow == null) return null;

    if (_isStateDeptStale(isoCode, passportIso, _rows(countryRow['travel_advisories']), _visa(countryRow, passportIso)) &&
        await _refreshStateDept(isoCode)) {
      countryRow = await _fetchCountryRow(isoCode, passportIso) ?? countryRow;
    }

    final factsRow = countryRow['country_facts'] as Map<String, dynamic>?;
    final cityRows = _rows(countryRow['cities']);
    final guideRow = countryRow['country_guides'] as Map<String, dynamic>?;
    final languageRows = _rows(countryRow['country_languages']);
    final advisoryRows = _rows(countryRow['travel_advisories']);
    final visa = _visa(countryRow, passportIso);
    final wordRows = _rows(countryRow['words']);

    final guide = CountryGuide.fromJson(_guideJson(guideRow));
    final advisories = advisoryRows.map((r) => TravelAdvisory.fromJson(_advisoryJson(r))).toList();
    final words = wordRows.map((r) => Word.fromJson(_wordJson(r))).toList();

    return CountryBundle(
      country: Country.fromJson({
        'id': countryRow['id'],
        'isoCode': countryRow['iso_code'],
        'nameCommon': countryRow['name_common'],
        'nameOfficial': countryRow['name_official'] ?? countryRow['name_common'],
        'contentStatus': countryRow['content_status'] ?? 'none',
      }),
      facts: CountryFacts.fromJson(_factsJson(factsRow, languageRows)),
      cities: cityRows.map((r) => City.fromJson(_cityJson(r))).toList(),
      guide: guide,
      pointsOfInterest: const [],
      tips: const [],
      phrases: const [],
      words: words,
      categories: const [],
      advisories: advisories,
      contributorNames: const [],
      visa: visa,
      regionalNote: null, // regional_notes join not wired yet
      fetchedAt: DateTime.now(),
    );
  }

  // country_facts/country_guides are keyed by country_id, so they embed
  // as single objects. Visa join names its FK (two point at countries).
  Future<Map<String, dynamic>?> _fetchCountryRow(String isoCode, String passportIso) => _client
      .from('countries')
      .select('''
        id, iso_code, name_common, name_official, content_status,
        country_facts(*),
        cities(*),
        country_guides(*),
        country_languages(is_official, percent_speakers, percent_status, percent_speakers_source, percent_source_url, usage_note, languages(name)),
        travel_advisories(*),
        visa_requirements!destination_country_id(*),
        words(*)
      ''')
      .eq('iso_code', isoCode)
      // countries.id is the ISO code (migration 007).
      .eq('visa_requirements.nationality_country_id', passportIso)
      .limit(1, referencedTable: 'words') // only the word-of-the-day card reads this
      .maybeSingle();

  List<Map<String, dynamic>> _rows(Object? embedded) =>
      (embedded as List?)?.cast<Map<String, dynamic>>() ?? const [];

  // Missing or older than 30 days. Server re-checks and rate-limits.
  bool _isStateDeptStale(String isoCode, String passportIso, List<Map<String, dynamic>> advisoryRows, VisaInfo? visa) {
    final cutoff = DateTime.now().subtract(stateDeptStaleAfter);
    bool isStale(Object? verifiedAt) {
      final parsed = verifiedAt is String ? DateTime.tryParse(verifiedAt) : null;
      return parsed == null || parsed.isBefore(cutoff);
    }

    final usAdvisory = advisoryRows
        .where((r) => r['issuing_authority'] == 'US State Department')
        .firstOrNull;
    if (isStale(usAdvisory?['last_verified_at'])) return true;
    return isoCode != passportIso && (visa == null || visa.lastVerifiedAt.isBefore(cutoff));
  }

  // True if anything was refetched. Failure keeps the cached rows.
  Future<bool> _refreshStateDept(String isoCode) async {
    try {
      final response = await _client.functions.invoke(
        'refresh-country-state-dept',
        queryParameters: {'iso': isoCode},
        method: HttpMethod.get,
      );
      final data = response.data;
      return data is Map && data['refreshed'] == true;
    } catch (error) {
      debugPrint('State Dept refresh failed for $isoCode: $error');
      return false;
    }
  }

  // Embed is pre-filtered to [passportIso]; at most one row.
  VisaInfo? _visa(Map<String, dynamic> countryRow, String passportIso) {
    final rows = _rows(countryRow['visa_requirements']);
    if (rows.isEmpty) return null;
    final row = rows.first;
    // Unverified placeholder rows count as no data.
    if (row['last_verified_at'] == null) return null;

    return VisaInfo.fromJson({
      // `visa_requirements.issuing_authority` isn't migrated into the live
      // DB yet (added to the schema doc 2026-08-21, not backfilled) — fall
      // back to the one source V1 visa data actually comes from (see
      // CLAUDE.md's External Data Sources) rather than crashing the whole
      // country fetch on a missing column. Drop the fallback once the
      // migration + backfill lands and every row has a real value.
      'issuingAuthority': row['issuing_authority'] ?? 'US State Department',
      'summary': row['summary'],
      'officialUrl': row['official_url'],
      'applicationUrl': row['application_url'],
      'lastVerifiedAt': row['last_verified_at'],
      'nationalityIsoCode': passportIso,
      'prohibitedOnEntry': row['prohibited_on_entry'],
      'prohibitedOnExit': row['prohibited_on_exit'],
    });
  }

  Map<String, dynamic> _factsJson(Map<String, dynamic>? row, List<Map<String, dynamic>> languageRows) {
    // All-or-nothing: a partly verified country reads "coming soon".
    final verified = languageRows.isNotEmpty && languageRows.every((r) => r['percent_status'] == 'verified');
    final languages = verified ? languageRows.map(_languageJson).toList() : <Map<String, dynamic>>[];
    if (row == null) return {'languages': languages, 'borderingCountryCodes': null};
    return {
      'flagSvgUrl': null,
      'capital': row['capital'],
      'population': row['population'],
      'currencyCode': row['currency_code'],
      'currencyName': row['currency_name'],
      'callingCode': row['calling_code'],
      'languages': languages,
      'latitude': row['latitude'],
      'longitude': row['longitude'],
      // Not in the Supabase schema yet — see HANDOFF.md.
      'utcOffsetMinutes': null,
      'timezone': row['timezone'],
      'accentColorHex': null,
      'lastImportedAt': row['last_imported_at'],
      'emergencyNumber': null,
      'borderingCountryCodes': (row['neighbors'] as List?)?.cast<String>() ?? [],
      'climates': row['climates'] ?? [],
    };
  }

  Map<String, dynamic> _languageJson(Map<String, dynamic> row) => {
    'name': (row['languages'] as Map<String, dynamic>)['name'],
    'isOfficial': row['is_official'] ?? true,
    'percentSpeakers': row['percent_speakers'],
    'usageNote': row['usage_note'],
    'source': row['percent_speakers_source'],
    'sourceUrl': row['percent_source_url'],
  };

  Map<String, dynamic> _cityJson(Map<String, dynamic> row) => {
    'id': row['id'],
    'name': row['name'],
    'population': row['population'],
    'latitude': row['latitude'],
    'longitude': row['longitude'],
    'isFeatured': row['is_featured'] ?? false,
  };

  Map<String, dynamic> _guideJson(Map<String, dynamic>? row) {
    if (row == null) {
      return {
        'bestTimes': [],
        'seasons': [],
        'practicalNorms': [],
        'dressExpectations': [],
        'cuisine': [],
        'historicalEvents': [],
        'festivals': [],
        'prepNotes': [],
      };
    }
    return {
      'bestTimes': _bestTimesJson(row['best_times'] as List?),
      'seasons': const [], // not populated by the importer yet
      'practicalNorms': _normsJson(row['practical_norms'] as List?),
      // Not rendered anywhere in the accordion UI yet — left empty rather
      // than mapped unused.
      'dressExpectations': [],
      'cuisine': [],
      'historicalEvents': [],
      'festivals': [],
      'prepNotes': [],
      'lastReviewedAt': row['last_reviewed_at'],
    };
  }

  List<Map<String, dynamic>> _bestTimesJson(List<dynamic>? entries) {
    const validCrowdLevels = {'low', 'moderate', 'high', 'peak'};
    return (entries ?? []).map((e) {
      final crowdLevel = e['crowd_level'] as String?;
      return {
        'months': e['months'],
        'whyShort': e['why_short'] ?? '',
        'why': e['why'] ?? '',
        'crowdLevel': validCrowdLevels.contains(crowdLevel) ? crowdLevel : 'moderate',
      };
    }).toList();
  }

  List<Map<String, dynamic>> _normsJson(List<dynamic>? entries) {
    const validSeverities = {'fyi', 'important', 'critical'};
    return (entries ?? []).map((e) {
      final severity = e['severity'] as String?;
      return {
        'type': e['type'],
        'title': e['title'],
        'body': e['body'],
        'severity': validSeverities.contains(severity) ? severity : 'fyi',
      };
    }).toList();
  }

  Map<String, dynamic> _advisoryJson(Map<String, dynamic> row) => {
    'issuingAuthority': row['issuing_authority'],
    'level': row['level'],
    'levelLabel': row['level_label'],
    'summary': row['summary'],
    'officialUrl': row['official_url'],
    'issuedAt': row['issued_at'],
    'lastVerifiedAt': row['last_verified_at'],
  };

  Map<String, dynamic> _wordJson(Map<String, dynamic> row) => {
    'id': row['id'],
    'lemma': row['lemma'],
    'translation': row['translation'],
    'partOfSpeech': row['part_of_speech'],
    'gender': row['gender'],
    'pronunciation': row['pronunciation'],
    'ipa': row['ipa'],
    'audioUrl': null, // not in the Supabase schema yet
    'usageNote': row['usage_note'],
    'difficulty': row['difficulty'],
    'categoryIds': const [], // word_categories join not wired yet
  };
}
