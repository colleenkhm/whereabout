import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../models/travel_info.dart';
import '../../theme/accordion_theme.dart';
import '../../utils/format_date.dart';
import 'external_link.dart';
import 'section_source.dart';

/// The "Visa & Entry" [AccordionSection]'s expanded content. No invented
/// "No visa required" headline — [VisaInfo.summary] is free text only.
class VisaSection extends StatelessWidget {
  final VisaInfo visa;
  final RegionalNote? regionalNote;

  /// This section's dark accent.
  final Color accent;

  const VisaSection({
    super.key,
    required this.visa,
    required this.accent,
    this.regionalNote,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(visa.issuingAuthority, style: AccordionTheme.sLabel),
              const SizedBox(height: 5),
              Text(
                'For ${visa.nationalityIsoCode} passport holders',
                style: AccordionTheme.sHead,
              ),
              const SizedBox(height: 6),
              Text(visa.summary, style: AccordionTheme.sBody),
              if (visa.applicationUrl != null) ...[
                const SizedBox(height: 4),
                Align(
                  alignment: Alignment.centerRight,
                  child: ExternalLink(
                    label: 'Apply',
                    url: visa.applicationUrl!,
                    color: accent,
                    fontFamily: AccordionTheme.dmMono,
                  ),
                ),
              ],
              if (regionalNote != null) ...[
                const SizedBox(height: 10),
                _RegionalNoteWarning(summary: regionalNote!.summary),
              ],
              if (visa.prohibitedOnEntry != null ||
                  visa.prohibitedOnExit != null)
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  padding: const EdgeInsets.only(top: 11),
                  decoration: const BoxDecoration(
                    border: Border(top: BorderSide(color: AccordionTheme.rule)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (visa.prohibitedOnEntry != null)
                        _ProhibitedNote(
                          label: 'Declare on entry',
                          body: visa.prohibitedOnEntry!,
                        ),
                      if (visa.prohibitedOnEntry != null &&
                          visa.prohibitedOnExit != null)
                        const SizedBox(height: 8),
                      if (visa.prohibitedOnExit != null)
                        _ProhibitedNote(
                          label: 'Declare on exit',
                          body: visa.prohibitedOnExit!,
                        ),
                    ],
                  ),
                ),
              SectionSource(
                notes: ['Visa & entry info verified ${formatShortDate(visa.lastVerifiedAt)}'],
                links: [('Source', visa.officialUrl)],
                color: accent,
              ),
            ],
          ),
        ),
        if (regionalNote != null)
          Positioned(
            bottom: 14,
            right: 16,
            child: _RegionalStamp(
              groupSlug: regionalNote!.groupSlug,
              accent: accent,
            ),
          ),
      ],
    );
  }
}

/// Shown instead of [VisaSection] when there's no verified visa row.
class VisaNoResults extends StatelessWidget {
  /// The country's State Dept page; general country index if null.
  final String? stateDeptUrl;
  final Color accent;

  static const _fallbackUrl =
      'https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages.html';

  const VisaNoResults({super.key, required this.accent, this.stateDeptUrl});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      child: Text.rich(
        TextSpan(
          style: AccordionTheme.sBody,
          children: [
            const TextSpan(
              text: 'No visa information available at this time. Check the ',
            ),
            WidgetSpan(
              alignment: PlaceholderAlignment.middle,
              child: ExternalLink(
                label: 'US State Department',
                url: stateDeptUrl ?? _fallbackUrl,
                color: accent,
                fontFamily: AccordionTheme.dmMono,
              ),
            ),
            const TextSpan(text: ' for the latest information.'),
          ],
        ),
      ),
    );
  }
}

/// The "upcoming requirement" highlight box — `.visa-warn`.
class _RegionalNoteWarning extends StatelessWidget {
  final String summary;

  const _RegionalNoteWarning({required this.summary});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: AccordionTheme.warn.withValues(alpha: 0.08),
        border: Border.all(color: AccordionTheme.warn.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        summary,
        style: AccordionTheme.sBody.copyWith(
          fontSize: 12.5,
          color: AccordionTheme.warn,
        ),
      ),
    );
  }
}

/// `.visa-stamp` — a rotated corner stamp naming [RegionalNote.groupSlug]
/// (e.g. "Schengen").
class _RegionalStamp extends StatelessWidget {
  final String groupSlug;
  final Color accent;

  const _RegionalStamp({required this.groupSlug, required this.accent});

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: -5 * math.pi / 180,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: accent.withValues(alpha: 0.25), width: 1.5),
        ),
        child: Text(
          groupSlug.toUpperCase(),
          style: TextStyle(
            fontFamily: AccordionTheme.dmMono,
            fontSize: 9,
            fontWeight: FontWeight.w500,
            letterSpacing: 1.0,
            color: accent.withValues(alpha: 0.6),
          ),
        ),
      ),
    );
  }
}

class _ProhibitedNote extends StatelessWidget {
  final String label;
  final String body;

  const _ProhibitedNote({required this.label, required this.body});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: AccordionTheme.sLabel.copyWith(color: AccordionTheme.danger),
        ),
        const SizedBox(height: 3),
        Text(body, style: AccordionTheme.sBody),
      ],
    );
  }
}
