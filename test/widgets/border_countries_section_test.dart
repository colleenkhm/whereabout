import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:whereabout/models/country.dart';
import 'package:whereabout/widgets/country_page/border_countries_section.dart';

const _accent = Color(0xFF3A78AA);

/// [BorderCountriesSection] resolves codes against a plain passed-in
/// country list (see that class's doc) rather than watching
/// `TripSelection` itself, so it's testable without a `Provider`/full app
/// boot.
void main() {
  final allCountries = [
    const Country(
      countryCode: 'PA',
      name: 'Panama',
      continent: 'north-america',
      languageCode: 'es',
      active: false,
    ),
    const Country(
      countryCode: 'NI',
      name: 'Nicaragua',
      continent: 'north-america',
      languageCode: 'es',
      active: false,
    ),
  ];

  Future<void> pump(WidgetTester tester, Widget child) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: SingleChildScrollView(child: child)),
      ),
    );
  }

  testWidgets('renders each resolved border country by name, no exception', (
    tester,
  ) async {
    await pump(
      tester,
      BorderCountriesSection(
        countryCode: 'CR',
        borderingCountryCodes: const ['PA', 'NI'],
        allCountries: allCountries,
        accent: _accent,
        onTapBorderCountry: (_) {},
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Panama'), findsOneWidget);
    expect(find.text('Nicaragua'), findsOneWidget);
  });

  testWidgets('an unresolved code still renders, as its raw code', (
    tester,
  ) async {
    await pump(
      tester,
      BorderCountriesSection(
        countryCode: 'CR',
        borderingCountryCodes: const ['PA', 'ZZ'],
        allCountries: allCountries,
        accent: _accent,
        onTapBorderCountry: (_) {},
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Panama'), findsOneWidget);
    expect(find.text('ZZ'), findsOneWidget);
  });

  testWidgets('tapping a resolved border country calls onTapBorderCountry with it', (
    tester,
  ) async {
    Country? tapped;
    await pump(
      tester,
      BorderCountriesSection(
        countryCode: 'CR',
        borderingCountryCodes: const ['PA'],
        allCountries: allCountries,
        accent: _accent,
        onTapBorderCountry: (country) => tapped = country,
      ),
    );

    await tester.tap(find.text('Panama'));
    await tester.pump();

    expect(tapped?.countryCode, 'PA');
  });

  testWidgets('empty list shows the landform', (tester) async {
    await pump(
      tester,
      BorderCountriesSection(
        countryCode: 'JP',
        borderingCountryCodes: const [],
        allCountries: allCountries,
        accent: _accent,
        onTapBorderCountry: (_) {},
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Archipelago'), findsOneWidget);
  });

  test('landform lookup', () {
    expect(Landform.forCountry('IS'), Landform.island);
    expect(Landform.forCountry('ph'), Landform.archipelago);
    expect(Landform.forCountry('AU'), Landform.islandContinent);
  });
}
