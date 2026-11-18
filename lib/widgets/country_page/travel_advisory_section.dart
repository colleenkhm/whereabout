import 'package:flutter/material.dart';

import '../../models/travel_info.dart';
import '../../theme/accordion_theme.dart';
import '../../utils/format_date.dart';
import 'section_source.dart';

/// The "Travel Advisory" [AccordionSection]'s expanded content, including
/// the top-right "Emergency" stamp.
class TravelAdvisorySection extends StatelessWidget {
  final List<TravelAdvisory> advisories;

  /// Top-right stamp, omitted when unknown.
  final String? emergencyNumber;

  /// This section's dark accent.
  final Color accent;

  const TravelAdvisorySection({
    super.key,
    required this.advisories,
    required this.accent,
    this.emergencyNumber,
  });

  // Leading digit from a level string like "Level 2", or null.
  int? _levelNumber(TravelAdvisory a) {
    final match = RegExp(r'(\d+)').firstMatch(a.level ?? '');
    return match == null ? null : int.parse(match.group(1)!);
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Padding(
          // Widens to make room for the emergency stamp.
          padding: EdgeInsets.fromLTRB(
            20,
            16,
            emergencyNumber != null ? 88 : 20,
            16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < advisories.length; i++) ...[
                if (i != 0) ...[
                  const SizedBox(height: 14),
                  Container(height: 1, color: AccordionTheme.rule),
                  const SizedBox(height: 14),
                ],
                _AdvisoryRow(
                  advisory: advisories[i],
                  level: _levelNumber(advisories[i]),
                  accent: accent,
                ),
              ],
            ],
          ),
        ),
        if (emergencyNumber != null)
          Positioned(
            top: 16,
            right: 20,
            child: _EmergencyStamp(number: emergencyNumber!),
          ),
      ],
    );
  }
}

class _AdvisoryRow extends StatelessWidget {
  final TravelAdvisory advisory;
  final int? level;
  final Color accent;

  const _AdvisoryRow({
    required this.advisory,
    required this.level,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    final color = level == null ? null : AccordionTheme.advisoryColor(level!);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(advisory.issuingAuthority, style: AccordionTheme.sLabel),
        if (advisory.level != null || advisory.levelLabel != null) ...[
          const SizedBox(height: 5),
          Text(
            [advisory.level, advisory.levelLabel].nonNulls.join(' — '),
            style: AccordionTheme.sHead.copyWith(
              color: color ?? AccordionTheme.ink,
            ),
          ),
        ],
        if (advisory.summary != null) ...[
          const SizedBox(height: 6),
          Text(advisory.summary!, style: AccordionTheme.sBody),
        ],
        SectionSource(
          notes: [
            if (advisory.issuedAt != null) 'Issued ${formatShortDate(advisory.issuedAt!)}',
            'Checked ${formatShortDate(advisory.lastVerifiedAt)}',
          ],
          links: [('Full advisory', advisory.officialUrl)],
          color: accent,
        ),
      ],
    );
  }
}

/// `.emerg-stamp` — "EMERGENCY / 112".
class _EmergencyStamp extends StatelessWidget {
  final String number;

  const _EmergencyStamp({required this.number});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('EMERGENCY', style: AccordionTheme.sLabel.copyWith(fontSize: 8)),
        const SizedBox(height: 2),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.call, size: 11, color: AccordionTheme.danger),
            const SizedBox(width: 4),
            Text(
              number,
              style: const TextStyle(
                fontFamily: AccordionTheme.fraunces,
                fontWeight: FontWeight.w900,
                fontSize: 16,
                color: AccordionTheme.danger,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
