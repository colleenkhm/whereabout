import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:whereabout/models/travel_info.dart';
import 'package:whereabout/widgets/country_page/travel_advisory_section.dart';
import 'package:whereabout/widgets/country_page/visa_section.dart';

// Arbitrary — these tests aren't about color, just exercising `accent` as
// a required param since both widgets took it on 2026-08-18 (see
// SectionPalette's class doc).
const _accent = Color(0xFF3A78AA);

/// [VisaSection] and [TravelAdvisorySection] replaced the combined
/// `TravelInfoSection` 2026-08-18 (see `VisaSection`'s class doc) — each
/// now cites its own source independently rather than sharing one footer,
/// so this covers that each renders standalone without exception,
/// including the [RegionalNote] stamp and the emergency-number stamp,
/// which both previously lived inside `IntrinsicHeight`-wrapped desktop
/// layout logic that no longer exists.
void main() {
  final advisory = TravelAdvisory(
    issuingAuthority: 'US State Department',
    level: 'Level 1',
    levelLabel: 'Exercise Normal Precautions',
    summary: 'Overall a very safe destination.',
    officialUrl: 'https://travel.state.gov/costa-rica',
    lastVerifiedAt: DateTime(2026, 7, 1),
  );

  final visaWithApplyLink = VisaInfo(
    issuingAuthority: 'US State Department',
    summary: 'US citizens may enter visa-free for up to 90 days.',
    officialUrl: 'https://travel.state.gov/costa-rica',
    applicationUrl: 'https://costarica-embassy.org/visas/',
    lastVerifiedAt: DateTime(2026, 7, 1),
    nationalityIsoCode: 'US',
  );

  final regionalNote = RegionalNote(
    groupSlug: 'schengen',
    noteType: 'entry',
    summary: 'From Q4 2026, an ETIAS authorization will be required.',
    officialUrl: 'https://travel.state.gov/costa-rica',
    lastVerifiedAt: DateTime(2026, 7, 1),
  );

  Future<void> pump(WidgetTester tester, Widget child) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: SingleChildScrollView(child: child)),
      ),
    );
  }

  testWidgets(
    'VisaSection: renders summary, apply link, and its own source, no exception',
    (tester) async {
      await pump(tester, VisaSection(visa: visaWithApplyLink, accent: _accent));

      expect(tester.takeException(), isNull);
      expect(find.text('US State Department'), findsOneWidget);
      expect(find.textContaining('90 days'), findsOneWidget);
      expect(find.textContaining('Apply', findRichText: true), findsOneWidget);
      // 'Official source' -> 'Source', 2026-08-19, per direction received
      // (see VisaSection).
      expect(find.textContaining('Source', findRichText: true), findsOneWidget);
    },
  );

  testWidgets(
    'VisaSection: regional note renders a warning box and a corner stamp',
    (tester) async {
      await pump(
        tester,
        VisaSection(
          visa: visaWithApplyLink,
          regionalNote: regionalNote,
          accent: _accent,
        ),
      );

      expect(tester.takeException(), isNull);
      expect(find.textContaining('ETIAS'), findsOneWidget);
      expect(find.text('SCHENGEN'), findsOneWidget);
    },
  );

  testWidgets(
    'TravelAdvisorySection: renders level, summary, and full-advisory link, no exception',
    (tester) async {
      await pump(
        tester,
        TravelAdvisorySection(advisories: [advisory], accent: _accent),
      );

      expect(tester.takeException(), isNull);
      expect(find.textContaining('Level 1'), findsOneWidget);
      expect(find.textContaining('Full advisory', findRichText: true), findsOneWidget);
    },
  );

  testWidgets(
    'TravelAdvisorySection: emergency number renders as a stamp when known',
    (tester) async {
      await pump(
        tester,
        TravelAdvisorySection(
          advisories: [advisory],
          emergencyNumber: '911',
          accent: _accent,
        ),
      );

      expect(tester.takeException(), isNull);
      expect(find.text('911'), findsOneWidget);
      expect(find.text('EMERGENCY'), findsOneWidget);
    },
  );
}
