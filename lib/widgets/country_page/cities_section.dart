import 'package:flutter/material.dart';

import '../../models/country_bundle.dart';
import '../../theme/accordion_theme.dart';
import '../../utils/format_population.dart';
import 'section_source.dart';

/// The "Cities" [AccordionSection]'s expanded content — a numbered list
/// of cities on the section's plain white background. No chevron/tap
/// affordance — there's no dedicated city page to link to yet.
class CitiesSection extends StatelessWidget {
  final List<City> cities;

  /// Matched against [City.name] to render the "Capital" meta label.
  final String? capital;

  /// A version of this section's flag color guaranteed to read on white —
  /// the only place that color shows up here, on the index numbers.
  /// Featured-city star stays fixed gold.
  final Color accent;

  const CitiesSection({
    super.key,
    required this.cities,
    required this.accent,
    this.capital,
  });

  // Some countries have dozens of cities on file — cap the list to the
  // top few so the section doesn't dwarf its neighbors. The accordion's
  // meta line still shows the true count, so this cutoff is never
  // misleading (same reasoning as border countries, reverted there).
  static const _maxDisplayed = 5;

  @override
  Widget build(BuildContext context) {
    if (cities.isEmpty) return const SizedBox.shrink();

    // Featured cities first, then by population descending. Unknown
    // population sorts last within its featured/non-featured group.
    final sorted = [...cities]
      ..sort((a, b) {
        if (a.isFeatured != b.isFeatured) return a.isFeatured ? -1 : 1;
        if (a.population == null && b.population == null) return 0;
        if (a.population == null) return 1;
        if (b.population == null) return -1;
        return b.population!.compareTo(a.population!);
      });

    // The capital always leads the shown set, regardless of its
    // featured/population rank — a small or unfeatured capital (on file
    // at all) shouldn't be able to fall off the list.
    City? capitalCity;
    for (final city in sorted) {
      if (city.name == capital) {
        capitalCity = city;
        break;
      }
    }
    final shown = capitalCity == null
        ? sorted.take(_maxDisplayed).toList()
        : [
            capitalCity,
            ...sorted.where((city) => city != capitalCity).take(_maxDisplayed - 1),
          ];

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < shown.length; i++)
          _CityRow(
            index: i + 1,
            city: shown[i],
            isCapital: shown[i].name == capital,
            isLast: i == shown.length - 1,
            accent: accent,
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 13),
          child: SectionSource(links: const [('GeoNames', 'https://www.geonames.org/')], color: accent),
        ),
      ],
    );
  }
}

class _CityRow extends StatelessWidget {
  final int index;
  final City city;
  final bool isCapital;
  final bool isLast;
  final Color accent;

  const _CityRow({
    required this.index,
    required this.city,
    required this.isCapital,
    required this.isLast,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    final metaParts = <String>[
      if (isCapital) 'Capital',
      if (city.population != null) formatPopulation(city.population!),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
      decoration: isLast
          ? null
          : const BoxDecoration(border: Border(bottom: BorderSide(color: AccordionTheme.rule))),
      child: Row(
        children: [
          SizedBox(
            width: 18,
            child: Text(
              index.toString().padLeft(2, '0'),
              style: AccordionTheme.rowMeta.copyWith(color: accent, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Row(
              children: [
                Flexible(
                  child: Text(
                    city.name,
                    style: AccordionTheme.rowTitle,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (city.isFeatured) ...[
                  const SizedBox(width: 5),
                  const Text('★', style: TextStyle(color: AccordionTheme.butterDark, fontSize: 11)),
                ],
              ],
            ),
          ),
          if (metaParts.isNotEmpty)
            Text(metaParts.join(' · '), style: AccordionTheme.rowMeta),
        ],
      ),
    );
  }
}
