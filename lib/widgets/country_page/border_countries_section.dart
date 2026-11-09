import 'package:flutter/material.dart';

import '../../models/country.dart';
import '../../theme/accordion_theme.dart';

/// The "Border Countries" [AccordionSection]'s expanded content — every
/// country this one shares a land border with, on the section's plain
/// white background, each row linking to that country's own page.
/// An empty list means no land borders: shows the [Landform] instead.
class BorderCountriesSection extends StatelessWidget {
  /// This country's ISO alpha-2, used to pick its [Landform].
  final String countryCode;

  final List<String> borderingCountryCodes;

  /// Full country list, used to resolve each code to a display name/[Country].
  /// An unresolved code still renders, as its raw ISO code.
  final List<Country> allCountries;

  /// A version of this section's flag color guaranteed to read on white —
  /// used only on the chevron. Row text stays plain black ink.
  final Color accent;

  /// Called with the matched [Country] when a resolvable row is tapped.
  /// Navigation is the caller's job, not this widget's.
  final void Function(Country country) onTapBorderCountry;

  const BorderCountriesSection({
    super.key,
    required this.countryCode,
    required this.borderingCountryCodes,
    required this.allCountries,
    required this.accent,
    required this.onTapBorderCountry,
  });

  @override
  Widget build(BuildContext context) {
    if (borderingCountryCodes.isEmpty) {
      return _NoLandBorders(landform: Landform.forCountry(countryCode), accent: accent);
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < borderingCountryCodes.length; i++)
          _BorderCountryRow(
            code: borderingCountryCodes[i],
            country: _resolve(borderingCountryCodes[i]),
            isLast: i == borderingCountryCodes.length - 1,
            accent: accent,
            onTap: onTapBorderCountry,
          ),
      ],
    );
  }

  Country? _resolve(String code) {
    for (final country in allCountries) {
      if (country.countryCode == code) return country;
    }
    return null;
  }
}

class _BorderCountryRow extends StatelessWidget {
  final String code;
  final Country? country;
  final bool isLast;
  final Color accent;
  final void Function(Country country) onTap;

  const _BorderCountryRow({
    required this.code,
    required this.country,
    required this.isLast,
    required this.accent,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final country = this.country;
    final content = Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
      decoration: isLast
          ? null
          : const BoxDecoration(border: Border(bottom: BorderSide(color: AccordionTheme.rule))),
      child: Row(
        children: [
          Expanded(
            child: Text(
              country?.name ?? code,
              style: AccordionTheme.rowTitle,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          // Chevron is the only tappable-link affordance now; absent
          // entirely for an unresolved code.
          if (country != null) Icon(Icons.chevron_right, size: 16, color: accent),
        ],
      ),
    );

    // Only a resolvable border country is tappable.
    if (country == null) return content;
    return InkWell(onTap: () => onTap(country), child: content);
  }
}

/// Geographic shape of a country with no land borders.
enum Landform {
  island('Island', 'No land borders — surrounded entirely by water.'),
  archipelago('Archipelago', 'No land borders — a chain of islands surrounded by water.'),
  islandContinent('Island continent', 'No land borders — a whole continent surrounded by water.'),
  continent('Continent', 'No land borders — a continent surrounded by ocean.');

  final String label;
  final String description;
  const Landform(this.label, this.description);

  // Hand-set; anything unlisted defaults to island.
  static const _archipelagos = {
    'AG', 'AS', 'AX', 'BH', 'BM', 'BS', 'CC', 'CK', 'CV', 'FJ', 'FM', 'FO',
    'GD', 'GS', 'JP', 'KI', 'KM', 'KN', 'KY', 'MH', 'MP', 'MT', 'MV', 'NC',
    'NZ', 'PF', 'PH', 'PN', 'PW', 'SB', 'SC', 'SJ', 'ST', 'TC', 'TK', 'TO',
    'TT', 'TV', 'UM', 'VC', 'VG', 'VI', 'VU', 'WF', 'WS',
  };

  static Landform forCountry(String isoCode) {
    final code = isoCode.toUpperCase();
    if (code == 'AU') return Landform.islandContinent;
    if (code == 'AQ') return Landform.continent;
    if (_archipelagos.contains(code)) return Landform.archipelago;
    return Landform.island;
  }
}

class _NoLandBorders extends StatelessWidget {
  final Landform landform;
  final Color accent;

  const _NoLandBorders({required this.landform, required this.accent});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          CustomPaint(
            size: const Size(64, 40),
            painter: _LandformPainter(landform: landform, color: accent),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(landform.label, style: AccordionTheme.rowTitle),
                const SizedBox(height: 2),
                Text(
                  landform.description,
                  style: AccordionTheme.sBody.copyWith(color: AccordionTheme.ink3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Simple line drawing: land mound(s) over two wave lines.
class _LandformPainter extends CustomPainter {
  final Landform landform;
  final Color color;

  _LandformPainter({required this.landform, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final waterY = h * 0.62;

    final land = Paint()..color = color.withValues(alpha: 0.85);
    // (center x, half-width, height) as fractions of size.
    final mounds = switch (landform) {
      Landform.island => [(0.5, 0.26, 0.42)],
      Landform.archipelago => [(0.24, 0.13, 0.26), (0.52, 0.17, 0.38), (0.80, 0.11, 0.20)],
      Landform.islandContinent || Landform.continent => [(0.5, 0.42, 0.36)],
    };
    for (final (cx, hw, mh) in mounds) {
      final path = Path()
        ..moveTo((cx - hw) * w, waterY)
        ..quadraticBezierTo(cx * w, waterY - mh * h * 2, (cx + hw) * w, waterY)
        ..close();
      canvas.drawPath(path, land);
    }

    final wave = Paint()
      ..color = color.withValues(alpha: 0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    for (final (y, inset) in [(waterY + 1, 0.0), (waterY + h * 0.2, 0.12)]) {
      final path = Path()..moveTo(inset * w, y);
      const segments = 4;
      final segW = (w * (1 - 2 * inset)) / segments;
      for (var i = 0; i < segments; i++) {
        final x0 = inset * w + i * segW;
        path.quadraticBezierTo(x0 + segW / 2, y + (i.isEven ? -3 : 3), x0 + segW, y);
      }
      canvas.drawPath(path, wave);
    }
  }

  @override
  bool shouldRepaint(_LandformPainter old) => old.landform != landform || old.color != color;
}
