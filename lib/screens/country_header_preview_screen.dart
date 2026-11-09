import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:provider/provider.dart';

import '../data/currency_service.dart';
import '../data/supabase_country_repository.dart';
import '../models/country.dart' as country_model;
import '../models/country_bundle.dart';
import '../models/country_guide.dart';
import '../models/live_data.dart';
import '../models/resource.dart';
import '../models/travel_info.dart';
import '../state/trip_selection.dart';
import '../theme/accordion_theme.dart';
import '../theme/section_palette.dart';
import '../utils/flag_palette.dart' show extractFlagBaseColors;
import 'destination_screen.dart';
import '../widgets/country_page/accordion_section.dart';
import '../widgets/country_page/additional_resources_section.dart';
import '../widgets/country_page/best_times_section.dart';
import '../widgets/country_page/cities_section.dart';
import '../widgets/country_page/country_header.dart';
import '../widgets/country_page/language_pair_section.dart';
import '../widgets/country_page/border_countries_section.dart';
import '../widgets/country_page/paper_texture.dart';
import '../widgets/country_page/practical_norms_section.dart';
import '../widgets/country_page/travel_advisory_section.dart';
import '../widgets/country_page/visa_section.dart';
import '../widgets/site_footer.dart';
import '../widgets/site_header.dart';

/// The country page — a collapsible accordion of sections. See
/// HANDOFF.md for the full decision history.
class CountryHeaderPreviewScreen extends StatefulWidget {
  final country_model.Country country;

  const CountryHeaderPreviewScreen({super.key, required this.country});

  @override
  State<CountryHeaderPreviewScreen> createState() =>
      _CountryHeaderPreviewScreenState();
}

/// Accordion row order.
enum _Section {
  visa,
  cities,
  borderCountries,
  times,
  advisory,
  language,
  norms,
  resources,
}

class _CountryHeaderPreviewScreenState
    extends State<CountryHeaderPreviewScreen> {
  CountryBundle? _bundle;

  // Live USD rate, fetched once the bundle's currency is known. Null
  // renders an em dash — never a mock/stale value.
  ExchangeRate? _exchangeRate;

  // Falls back to hand-picked defaults until flag colors load.
  SectionPalette _palette = SectionPalette.fallback;

  // Starts fully collapsed.
  final Map<_Section, bool> _expanded = {
    for (final s in _Section.values) s: false,
  };

  @override
  void initState() {
    super.initState();
    _load();
    _loadPalette();
  }

  Future<void> _loadPalette() async {
    final colors = await extractFlagBaseColors(widget.country.countryCode);
    if (colors == null || colors.isEmpty || !mounted) return;
    setState(() => _palette = SectionPalette.fromFlagColors(colors));
  }

  Future<void> _load() async {
    final code = widget.country.countryCode.toLowerCase();

    CountryBundle? supabaseBundle;
    try {
      supabaseBundle = await SupabaseCountryRepository()
          .fetchCountryBundle(widget.country.countryCode);
    } catch (error) {
      debugPrint('Supabase fetch failed for $code: $error');
    }

    // Supabase's own curated content wins outright when it has any. Else,
    // prefer a local mock bundle if one actually exists (today, only
    // Costa Rica). Else, still show whatever Supabase has — even
    // commodity-only facts (timezone, currency, capital, cities,
    // neighbors) are real and available, and every country's page is
    // reachable from search regardless of curation status, so per
    // direction received: "I would like them to see any information that
    // is available to them" rather than an empty shell just because
    // nothing curated exists yet.
    if (supabaseBundle != null && _hasCuratedContent(supabaseBundle)) {
      setState(() => _bundle = supabaseBundle);
      _loadExchangeRate();
      return;
    }

    try {
      final raw = await rootBundle.loadString('assets/data/bundles/$code.json');
      setState(() {
        _bundle = CountryBundle.fromJson(
          jsonDecode(raw) as Map<String, dynamic>,
        );
      });
      _loadExchangeRate();
      return;
    } catch (_) {
      // No local mock bundle for this country — fall through.
    }

    if (supabaseBundle != null) {
      setState(() => _bundle = supabaseBundle);
      _loadExchangeRate();
      return;
    }

    debugPrint('No data anywhere for $code — showing an empty shell.');
    setState(() => _bundle = _emptyBundle(widget.country));
    _loadExchangeRate();
  }

  bool _hasCuratedContent(CountryBundle bundle) =>
      !bundle.guide.isEmpty ||
      bundle.advisories.isNotEmpty ||
      bundle.visa != null ||
      bundle.words.isNotEmpty;

  Future<void> _loadExchangeRate() async {
    final currencyCode = _bundle?.facts.currencyCode;
    if (currencyCode == null) return;
    final rate = await CurrencyService().fetchRate(currencyCode);
    if (!mounted) return;
    setState(() => _exchangeRate = rate);
  }

  // Empty shell so every section shows "Coming soon."
  CountryBundle _emptyBundle(country_model.Country country) {
    return CountryBundle(
      country: Country(
        id: country.countryCode.toLowerCase(),
        isoCode: country.countryCode,
        nameCommon: country.name,
        nameOfficial: country.name,
        contentStatus: ContentStatus.none,
      ),
      facts: const CountryFacts(languages: []),
      cities: const [],
      guide: const CountryGuide(
        bestTimes: [],
        seasons: [],
        practicalNorms: [],
        dressExpectations: [],
        cuisine: [],
        historicalEvents: [],
        festivals: [],
        prepNotes: [],
      ),
      pointsOfInterest: const [],
      tips: const [],
      phrases: const [],
      words: const [],
      categories: const [],
      advisories: const [],
      contributorNames: const [],
      fetchedAt: DateTime.now(),
    );
  }

  // US State Dept only for now.
  List<TravelAdvisory> _usAdvisories(CountryBundle bundle) => bundle.advisories
      .where((a) => a.issuingAuthority == 'US State Department')
      .toList();

  bool get _allExpanded => _expanded.values.every((v) => v);

  void _toggle(_Section section) {
    setState(() => _expanded[section] = !_expanded[section]!);
  }

  void _toggleAll() {
    final next = !_allExpanded;
    setState(() {
      for (final s in _Section.values) {
        _expanded[s] = next;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final bundle = _bundle;
    final trip = context.watch<TripSelection>();
    final resources = trip.resources;
    return Scaffold(
      backgroundColor: AccordionTheme.page,
      body: bundle == null
          ? const Center(child: CircularProgressIndicator())
          : PaperTexture(
              color: AccordionTheme.ink,
              child: SafeArea(
                top: false,
                child: Column(
                  children: [
                    SiteHeader(
                      // Clears the nav stack.
                      onHomeTap: () => Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(
                          builder: (context) => const DestinationScreen(),
                        ),
                        (route) => false,
                      ),
                      // Matches the masthead below.
                      backgroundColor: _palette.header.tint,
                    ),
                    Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CountryHeader(
                              bundle: bundle,
                              nativeName: widget.country.countryCode == 'CR'
                                  ? 'Costa Rica'
                                  : null,
                              nativeNameRomanized: null,
                              utcOffsetMinutes: bundle.facts.utcOffsetMinutes,
                              timezone: bundle.facts.timezone,
                              // Live via CurrencyService/_loadExchangeRate —
                              // null until it resolves, never a mock value.
                              exchangeRate: _exchangeRate,
                              currencyName: bundle.facts.currencyName,
                              allExpanded: _allExpanded,
                              onToggleAll: _toggleAll,
                              accent: _palette.visa,
                              header: _palette.header,
                              stub: _palette.stub,
                            ),
                            _visaSection(bundle),
                            _citiesSection(bundle),
                            _borderCountriesSection(bundle, trip.countries),
                            _timesSection(bundle),
                            _advisorySection(bundle),
                            _languageSection(bundle),
                            _normsSection(bundle),
                            _resourcesSection(resources),
                            const SiteFooter(),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  // --- Sections -----------------------------------------------------------

  Widget _visaSection(CountryBundle bundle) {
    final visa = bundle.visa;
    final colors = _palette.visa;
    return AccordionSection(
      title: 'Visa & Entry',
      tint: colors.tint,
      textColor: colors.textColor,
      hasData: true,
      meta: visa == null ? null : _firstClause(visa.summary),
      expanded: _expanded[_Section.visa]!,
      onToggle: () => _toggle(_Section.visa),
      contentBuilder: (_) => visa == null
          ? VisaNoResults(
              stateDeptUrl: _usAdvisories(bundle).firstOrNull?.officialUrl,
              accent: colors.accentOnWhite,
            )
          : VisaSection(
              visa: visa,
              regionalNote: bundle.regionalNote,
              accent: colors.accentOnWhite,
            ),
    );
  }

  Widget _citiesSection(CountryBundle bundle) {
    final cities = bundle.cities;
    final colors = _palette.cities;
    return AccordionSection(
      title: 'Cities',
      tint: colors.tint,
      textColor: colors.textColor,
      hasData: cities.isNotEmpty,
      meta: cities.isEmpty
          ? null
          : '${cities.length} destination${cities.length == 1 ? '' : 's'}',
      expanded: _expanded[_Section.cities]!,
      onToggle: () => _toggle(_Section.cities),
      contentBuilder: (_) => CitiesSection(
        cities: cities,
        capital: bundle.facts.capital,
        accent: colors.accentOnWhite,
      ),
    );
  }

  Widget _timesSection(CountryBundle bundle) {
    final bestTimes = bundle.guide.bestTimes;
    final colors = _palette.times;
    return AccordionSection(
      title: 'When to Visit',
      tint: colors.tint,
      textColor: colors.textColor,
      hasData: bestTimes.isNotEmpty,
      meta: bestTimes.isEmpty
          ? null
          : bestTimes.map((b) => b.months).join(' · '),
      expanded: _expanded[_Section.times]!,
      onToggle: () => _toggle(_Section.times),
      contentBuilder: (_) => BestTimesSection(bestTimes: bestTimes, palette: _palette.cycle),
    );
  }

  Widget _advisorySection(CountryBundle bundle) {
    final advisories = _usAdvisories(bundle);
    final first = advisories.isEmpty ? null : advisories.first;
    final metaLabel = first == null
        ? null
        : [first.level, first.issuingAuthority].nonNulls.join(' · ');
    final colors = _palette.advisory;
    return AccordionSection(
      title: 'Travel Advisory',
      tint: colors.tint,
      textColor: colors.textColor,
      hasData: advisories.isNotEmpty,
      meta: metaLabel,
      expanded: _expanded[_Section.advisory]!,
      onToggle: () => _toggle(_Section.advisory),
      contentBuilder: (_) => TravelAdvisorySection(
        advisories: advisories,
        emergencyNumber: bundle.facts.emergencyNumber,
        accent: colors.accentOnWhite,
      ),
    );
  }

  Widget _languageSection(CountryBundle bundle) {
    final languages = bundle.facts.languages;
    final featuredWord = bundle.words.isEmpty ? null : bundle.words.first;
    // Verified languages only (see repository); a word alone isn't enough.
    final hasData = languages.isNotEmpty;
    final colors = _palette.language;
    return AccordionSection(
      title: 'Language',
      tint: colors.tint,
      textColor: colors.textColor,
      hasData: hasData,
      meta: languages.isEmpty ? null : languages.map((l) => l.name).join(' · '),
      expanded: _expanded[_Section.language]!,
      onToggle: () => _toggle(_Section.language),
      contentBuilder: (_) => LanguagePairSection(
        languages: languages,
        featuredWord: featuredWord,
        tint: colors.tint,
        textColor: colors.textColor,
        accentOnWhite: colors.accentOnWhite,
      ),
    );
  }
  
    Widget _borderCountriesSection(
    CountryBundle bundle,
    List<country_model.Country> allCountries,
  ) {
    final codes = bundle.facts.borderingCountryCodes;
    final colors = _palette.borderCountries;
    return AccordionSection(
      title: 'Border Countries',
      tint: colors.tint,
      textColor: colors.textColor,
      hasData: codes != null,
      meta: codes == null
          ? null
          : codes.isEmpty
              ? Landform.forCountry(bundle.country.isoCode).label
              : '${codes.length} bordering ${codes.length == 1 ? 'country' : 'countries'}',
      expanded: _expanded[_Section.borderCountries]!,
      onToggle: () => _toggle(_Section.borderCountries),
      contentBuilder: (_) => BorderCountriesSection(
        countryCode: bundle.country.isoCode,
        borderingCountryCodes: codes ?? const [],
        allCountries: allCountries,
        accent: colors.accentOnWhite,
        onTapBorderCountry: (country) {
          context.read<TripSelection>().selectCountry(country);
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) =>
                  CountryHeaderPreviewScreen(country: country),
            ),
          );
        },
      ),
    );
  }

  Widget _normsSection(CountryBundle bundle) {
    final norms = bundle.guide.practicalNorms;
    final colors = _palette.norms;
    return AccordionSection(
      title: 'Practical Norms',
      tint: colors.tint,
      textColor: colors.textColor,
      hasData: norms.isNotEmpty,
      meta: norms.isEmpty ? null : norms.map((n) => n.title).join(' · '),
      expanded: _expanded[_Section.norms]!,
      onToggle: () => _toggle(_Section.norms),
      contentBuilder: (_) => PracticalNormsSection(
        norms: norms,
        tint: colors.tint,
        textColor: colors.textColor,
      ),
    );
  }

  Widget _resourcesSection(List<Resource> resources) {
    final colors = _palette.resources;
    return AccordionSection(
      title: 'Additional Resources',
      tint: colors.tint,
      textColor: colors.textColor,
      hasData: resources.isNotEmpty,
      meta: resources.isEmpty
          ? null
          : resources.map((r) => r.label).join(' · '),
      expanded: _expanded[_Section.resources]!,
      onToggle: () => _toggle(_Section.resources),
      contentBuilder: (_) => AdditionalResourcesSection(
        resources: resources,
        accent: colors.accentOnWhite,
      ),
    );
  }

  // First clause of the summary, truncated, for a collapsed row's meta.
  String _firstClause(String summary) {
    final period = summary.indexOf('.');
    final clause = period == -1 ? summary : summary.substring(0, period);
    return clause.length > 60 ? '${clause.substring(0, 60)}…' : clause;
  }
}
