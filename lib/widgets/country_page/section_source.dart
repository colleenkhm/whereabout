import 'package:flutter/material.dart';

import '../../theme/accordion_theme.dart';
import 'external_link.dart';

/// Source footer for every country-page section.
class SectionSource extends StatelessWidget {
  /// Dates or caveats, e.g. "Checked 3 Nov 2026".
  final List<String> notes;

  /// (label, url) pairs.
  final List<(String, String)> links;

  /// Link and rule color.
  final Color color;

  const SectionSource({super.key, required this.links, required this.color, this.notes = const []});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: color.withValues(alpha: 0.15))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (notes.isNotEmpty)
            Wrap(
              spacing: 12,
              runSpacing: 4,
              children: [for (final note in notes) Text(note, style: AccordionTheme.srcRow)],
            ),
          if (notes.isNotEmpty && links.isNotEmpty) const SizedBox(height: 4),
          if (links.isNotEmpty)
            Wrap(
              alignment: WrapAlignment.end,
              spacing: 12,
              runSpacing: 4,
              children: [
                for (final (label, url) in links)
                  ExternalLink(label: label, url: url, color: color, fontFamily: AccordionTheme.dmMono),
              ],
            ),
        ],
      ),
    );
  }
}
