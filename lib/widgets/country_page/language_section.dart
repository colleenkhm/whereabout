import 'dart:math';

import 'package:flutter/material.dart';

import '../../models/country_bundle.dart';
import '../../theme/accordion_theme.dart';
import 'external_link.dart';

/// The "Language" [AccordionSection]'s expanded content: a country's
/// languages with speaker percentages. Content-only, no card chrome.
class LanguageSection extends StatelessWidget {
  final List<LanguageEntry> languages;

  /// ISO 3166-1 alpha-2, for [_LanguagesCard._manyLanguageCountries].
  final String countryCode;

  /// This section's flag color.
  final Color tint;

  /// Black or white, whichever reads on [tint].
  final Color textColor;

  const LanguageSection({
    super.key,
    required this.languages,
    required this.countryCode,
    required this.tint,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (languages.isEmpty) return const SizedBox.shrink();
    return _LanguagesCard(
      languages: languages,
      countryCode: countryCode,
      tint: tint,
      textColor: textColor,
    );
  }
}

class _LanguagesCard extends StatelessWidget {
  final List<LanguageEntry> languages;
  final String countryCode;
  final Color tint;
  final Color textColor;

  const _LanguagesCard({
    required this.languages,
    required this.countryCode,
    required this.tint,
    required this.textColor,
  });

  /// Fewest languages shown.
  static const _minShown = 3;

  /// Many large language groups; always show [_maxShown].
  static const _manyLanguageCountries = {'ZA', 'IN', 'CN', 'RU', 'CH'};

  /// Every language at or above this percent is shown, up to [_maxShown].
  static const _widelySpokenPercent = 30.0;

  /// Most rows the card fits.
  static const _maxShown = 5;

  /// By [LanguageEntry.percentSpeakers] descending; languages without a
  /// verified figure sort last, by display rank, then official first.
  /// Top three (five in [_manyLanguageCountries]), or every language at
  /// 30%+ if more, capped at five. English
  /// is always present, even when cut or missing from the source data, so a
  /// traveler can always see at a glance whether it's spoken here.
  List<LanguageEntry> get _displayLanguages {
    final sorted = [...languages]
      ..sort((a, b) {
        final byPercent = (b.percentSpeakers ?? -1).compareTo(a.percentSpeakers ?? -1);
        if (byPercent != 0) return byPercent;
        final byRank = (a.displayRank ?? 1 << 30).compareTo(b.displayRank ?? 1 << 30);
        if (byRank != 0) return byRank;
        return (b.isOfficial ? 1 : 0).compareTo(a.isOfficial ? 1 : 0);
      });
    final widelySpoken = sorted.where((l) => (l.percentSpeakers ?? 0) >= _widelySpokenPercent).length;
    final floor = _manyLanguageCountries.contains(countryCode) ? _maxShown : _minShown;
    final shown = sorted.take(min(_maxShown, max(floor, widelySpoken))).toList();
    bool isEnglish(LanguageEntry l) => l.name.toLowerCase() == 'english';
    if (!shown.any(isEnglish)) {
      if (shown.length == _maxShown) shown.removeLast();
      shown.add(sorted.firstWhere(isEnglish, orElse: () => const LanguageEntry(name: 'English', isOfficial: false)));
    }
    return shown;
  }

  /// URL → short label, deduped. Citations required by source terms.
  static Map<String, String> _sources(List<LanguageEntry> shown) => {
        for (final l in shown)
          if (l.sourceUrl != null && l.source != null) l.sourceUrl!: l.source!.split(',').first.trim(),
      };

  @override
  Widget build(BuildContext context) {
    final display = _displayLanguages;
    final sources = _sources(display);
    return ColoredBox(
      color: tint,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < display.length; i++) ...[
              if (i != 0)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Container(height: 1, color: textColor.withValues(alpha: 0.15)),
                ),
              _LanguageRow(entry: display[i], textColor: textColor),
            ],
            if (sources.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(height: 1, color: textColor.withValues(alpha: 0.15)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 12,
                runSpacing: 4,
                children: [
                  for (final MapEntry(key: url, value: label) in sources.entries)
                    ExternalLink(label: label, url: url, color: textColor, fontFamily: AccordionTheme.dmMono),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _LanguageRow extends StatelessWidget {
  final LanguageEntry entry;
  final Color textColor;

  const _LanguageRow({required this.entry, required this.textColor});

  static String _formatPercent(double percent) {
    final rounded = percent == percent.roundToDouble()
        ? percent.round().toString()
        : percent.toStringAsFixed(1);
    return '$rounded%';
  }

  @override
  Widget build(BuildContext context) {
    final percent = entry.percentSpeakers;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(entry.name, style: AccordionTheme.rowTitle.copyWith(color: textColor))),
              // Unofficial is implied by absence.
              if (entry.isOfficial) ...[
                Icon(Icons.star, size: 11, color: textColor),
                const SizedBox(width: 3),
                Text(
                  'official',
                  style: TextStyle(
                    fontFamily: AccordionTheme.dmMono,
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                    color: textColor,
                  ),
                ),
              ],
            ],
          ),
          // No bar when there's no sourced figure — an empty/zero-filled
          // bar would misrepresent "we don't know" as "basically none".
          if (percent != null) ...[
            const SizedBox(height: 5),
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(2.5),
                    child: LinearProgressIndicator(
                      value: (percent / 100).clamp(0.0, 1.0),
                      minHeight: 5,
                      backgroundColor: textColor.withValues(alpha: 0.15),
                      valueColor: AlwaysStoppedAnimation(textColor.withValues(alpha: 0.85)),
                    ),
                  ),
                ),
                const SizedBox(width: 7),
                Text(
                  _formatPercent(percent),
                  style: TextStyle(
                    fontFamily: AccordionTheme.dmMono,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ],
            ),
          ],
          if (entry.usageNote != null) ...[
            const SizedBox(height: 3),
            Text(
              entry.usageNote!,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: AccordionTheme.dmMono,
                fontSize: 10,
                fontStyle: FontStyle.italic,
                color: textColor.withValues(alpha: 0.75),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
