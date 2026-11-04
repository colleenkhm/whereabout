/// Core client data shapes — see the data architecture doc's "Client Data
/// Objects" section. Separate from the pre-pivot lib/models/country.dart;
/// see HANDOFF.md.
library;

import 'country_guide.dart';
import 'language_content.dart';
import 'point_of_interest.dart';
import 'travel_info.dart';

enum ContentStatus { none, partial, complete }

/// The four country-page tabs.
enum CountryTab { overview, explore, guide, language }

ContentStatus _contentStatusFromJson(String value) =>
    ContentStatus.values.firstWhere((e) => e.name == value);

/// One language spoken in a country — official or not. Backed by
/// `country_languages`/`languages`; see the data architecture doc's
/// "Curated: language content" section. [percentSpeakers] is null, not 0,
/// whenever no reasonably sourced figure exists — never guessed (Tier C,
/// same standard as `usageNote`).
class LanguageEntry {
  final String name;
  final bool isOfficial;
  final double? percentSpeakers;
  final String? usageNote;

  /// Full citation for [percentSpeakers].
  final String? source;
  final String? sourceUrl;

  const LanguageEntry({
    required this.name,
    required this.isOfficial,
    this.percentSpeakers,
    this.usageNote,
    this.source,
    this.sourceUrl,
  });

  factory LanguageEntry.fromJson(Map<String, dynamic> json) {
    return LanguageEntry(
      name: json['name'] as String,
      isOfficial: json['isOfficial'] as bool? ?? false,
      percentSpeakers: (json['percentSpeakers'] as num?)?.toDouble(),
      usageNote: json['usageNote'] as String?,
      source: json['source'] as String?,
      sourceUrl: json['sourceUrl'] as String?,
    );
  }
}

class Country {
  final String id;
  final String isoCode;
  final String nameCommon;
  final String nameOfficial;
  final ContentStatus contentStatus;

  const Country({
    required this.id,
    required this.isoCode,
    required this.nameCommon,
    required this.nameOfficial,
    required this.contentStatus,
  });

  factory Country.fromJson(Map<String, dynamic> json) {
    return Country(
      id: json['id'] as String,
      isoCode: json['isoCode'] as String,
      nameCommon: json['nameCommon'] as String,
      nameOfficial: json['nameOfficial'] as String,
      contentStatus: _contentStatusFromJson(json['contentStatus'] as String),
    );
  }
}

/// Nearly every field here is nullable — imports fail, small countries have
/// gaps.
class CountryFacts {
  final String? flagSvgUrl;
  final String? capital;
  final int? population;
  final String? currencyCode;
  final String? currencyName;
  final String? callingCode;
  final List<LanguageEntry> languages;
  final double? latitude;
  final double? longitude;

  /// Fixed offset from UTC, in minutes. Not DST-aware — a fallback for
  /// when [timezone] isn't known.
  final int? utcOffsetMinutes;

  /// IANA timezone name (e.g. "Europe/Athens") — DST-aware, preferred over
  /// [utcOffsetMinutes] when present.
  final String? timezone;

  /// A representative flag color, as "#RRGGBB". Hand-picked, not derived.
  final String? accentColorHex;

  final DateTime? lastImportedAt;

  /// General emergency services number. Hand-curated, no importer yet.
  final String? emergencyNumber;

  /// ISO alpha-2 codes of every bordering country (e.g. `["PA", "NI"]`).
  /// Empty = no land borders (island); null = no facts imported yet.
  final List<String>? borderingCountryCodes;

  /// Köppen climate zones. Commodity, no importer yet.
  final List<Climate> climates;

  const CountryFacts({
    this.flagSvgUrl,
    this.capital,
    this.population,
    this.currencyCode,
    this.currencyName,
    this.callingCode,
    required this.languages,
    this.latitude,
    this.longitude,
    this.utcOffsetMinutes,
    this.timezone,
    this.accentColorHex,
    this.lastImportedAt,
    this.emergencyNumber,
    this.borderingCountryCodes,
    this.climates = const [],
  });

  factory CountryFacts.fromJson(Map<String, dynamic> json) {
    return CountryFacts(
      flagSvgUrl: json['flagSvgUrl'] as String?,
      capital: json['capital'] as String?,
      population: json['population'] as int?,
      currencyCode: json['currencyCode'] as String?,
      currencyName: json['currencyName'] as String?,
      callingCode: json['callingCode'] as String?,
      languages: (json['languages'] as List<dynamic>? ?? [])
          .map((e) => LanguageEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
      utcOffsetMinutes: json['utcOffsetMinutes'] as int?,
      timezone: json['timezone'] as String?,
      accentColorHex: json['accentColorHex'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      lastImportedAt: json['lastImportedAt'] == null
          ? null
          : DateTime.parse(json['lastImportedAt'] as String),
      emergencyNumber: json['emergencyNumber'] as String?,
      borderingCountryCodes: (json['borderingCountryCodes'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      climates: (json['climates'] as List<dynamic>? ?? [])
          .map((e) => Climate.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class Climate {
  /// Köppen code, e.g. "Af", "Cfb".
  final String koppen;

  /// e.g. "Tropical monsoon climate". Null for split codes like "As/Aw".
  final String? label;

  /// Cities in this zone, e.g. "San José, Heredia".
  final String? regions;

  const Climate({required this.koppen, this.label, this.regions});

  factory Climate.fromJson(Map<String, dynamic> json) {
    return Climate(
      koppen: json['koppen'] as String,
      label: json['label'] as String?,
      regions: json['regions'] as String?,
    );
  }
}

class City {
  final String id;
  final String name;
  final int? population;
  final double? latitude;
  final double? longitude;
  final bool isFeatured;

  const City({
    required this.id,
    required this.name,
    this.population,
    this.latitude,
    this.longitude,
    required this.isFeatured,
  });

  factory City.fromJson(Map<String, dynamic> json) {
    return City(
      id: json['id'] as String,
      name: json['name'] as String,
      population: json['population'] as int?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      isFeatured: json['isFeatured'] as bool,
    );
  }
}

class Leader {
  final String title;
  final String name;
  final DateTime? since;
  final String? sourceUrl;
  final DateTime? lastVerifiedAt;

  const Leader({
    required this.title,
    required this.name,
    this.since,
    this.sourceUrl,
    this.lastVerifiedAt,
  });

  factory Leader.fromJson(Map<String, dynamic> json) {
    return Leader(
      title: json['title'] as String,
      name: json['name'] as String,
      since: json['since'] == null
          ? null
          : DateTime.parse(json['since'] as String),
      sourceUrl: json['sourceUrl'] as String?,
      lastVerifiedAt: json['lastVerifiedAt'] == null
          ? null
          : DateTime.parse(json['lastVerifiedAt'] as String),
    );
  }
}

/// One fetch, one cache entry, one offline unit.
class CountryBundle {
  final Country country;
  final CountryFacts facts;
  final List<City> cities;
  final Leader? leader;
  final CountryGuide guide;
  final List<PointOfInterest> pointsOfInterest;
  final List<Tip> tips;
  final List<Phrase> phrases;
  final List<Word> words;
  final List<CategoryNode> categories;
  final List<TravelAdvisory> advisories;
  final List<String> contributorNames;
  final VisaInfo? visa;
  final RegionalNote? regionalNote;
  final DateTime fetchedAt;

  const CountryBundle({
    required this.country,
    required this.facts,
    required this.cities,
    this.leader,
    required this.guide,
    required this.pointsOfInterest,
    required this.tips,
    required this.phrases,
    required this.words,
    required this.categories,
    required this.advisories,
    required this.contributorNames,
    this.visa,
    this.regionalNote,
    required this.fetchedAt,
  });

  /// Which tabs have content — Overview is always included.
  List<CountryTab> get availableTabs => [
    CountryTab.overview,
    if (pointsOfInterest.isNotEmpty) CountryTab.explore,
    if (guide.hasGuideTabContent) CountryTab.guide,
    if (phrases.isNotEmpty || words.isNotEmpty) CountryTab.language,
  ];

  factory CountryBundle.fromJson(Map<String, dynamic> json) {
    return CountryBundle(
      country: Country.fromJson(json['country'] as Map<String, dynamic>),
      facts: CountryFacts.fromJson(json['facts'] as Map<String, dynamic>),
      cities: (json['cities'] as List<dynamic>? ?? [])
          .map((e) => City.fromJson(e as Map<String, dynamic>))
          .toList(),
      leader: json['leader'] == null
          ? null
          : Leader.fromJson(json['leader'] as Map<String, dynamic>),
      guide: CountryGuide.fromJson(json['guide'] as Map<String, dynamic>),
      pointsOfInterest: (json['pointsOfInterest'] as List<dynamic>? ?? [])
          .map((e) => PointOfInterest.fromJson(e as Map<String, dynamic>))
          .toList(),
      tips: (json['tips'] as List<dynamic>? ?? [])
          .map((e) => Tip.fromJson(e as Map<String, dynamic>))
          .toList(),
      phrases: (json['phrases'] as List<dynamic>? ?? [])
          .map((e) => Phrase.fromJson(e as Map<String, dynamic>))
          .toList(),
      words: (json['words'] as List<dynamic>? ?? [])
          .map((e) => Word.fromJson(e as Map<String, dynamic>))
          .toList(),
      categories: (json['categories'] as List<dynamic>? ?? [])
          .map((e) => CategoryNode.fromJson(e as Map<String, dynamic>))
          .toList(),
      advisories: (json['advisories'] as List<dynamic>? ?? [])
          .map((e) => TravelAdvisory.fromJson(e as Map<String, dynamic>))
          .toList(),
      contributorNames: (json['contributorNames'] as List<dynamic>? ?? [])
          .map((e) => e as String)
          .toList(),
      visa: json['visa'] == null
          ? null
          : VisaInfo.fromJson(json['visa'] as Map<String, dynamic>),
      regionalNote: json['regionalNote'] == null
          ? null
          : RegionalNote.fromJson(json['regionalNote'] as Map<String, dynamic>),
      fetchedAt: DateTime.parse(json['fetchedAt'] as String),
    );
  }
}
