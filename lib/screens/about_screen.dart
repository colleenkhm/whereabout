import 'package:flutter/material.dart';

import '../theme/accordion_theme.dart';
import '../widgets/country_page/external_link.dart';
import '../widgets/site_footer.dart';

/// About page. Currently just data-source credits — wording required by
/// each source's license/terms, see the data architecture doc.
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AccordionTheme.page,
      appBar: AppBar(title: const Text('About')),
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 640),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Sources & credits', style: AccordionTheme.pageHeading(26)),
                  const SizedBox(height: 8),
                  const Text(
                    'Travel tips, norms and language notes are written by hand. '
                    'The facts below come from these open data sources.',
                    style: AccordionTheme.sBody,
                  ),
                  const SizedBox(height: 16),
                  const _CreditsCard(),
                  const SiteFooter(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Credit {
  final String name;
  final String usedFor;
  final String notice;
  final List<(String, String)> links;

  const _Credit(this.name, this.usedFor, this.notice, this.links);
}

const _cc = ('CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/');

const _credits = [
  _Credit(
    'mledoze/countries',
    'Capitals, currencies, calling codes, borders',
    'Contains information from mledoze/countries, which is made available '
        'under the Open Database License (ODbL). Our adapted country facts '
        'are free to download under the ODbL too.',
    [
      ('mledoze/countries', 'https://github.com/mledoze/countries'),
      ('ODbL', 'https://opendatacommons.org/licenses/odbl/1-0/'),
      ('Download CSV', 'https://www.whereabout.world/data/country-facts.csv'),
      ('Data license', 'https://www.whereabout.world/data/country-facts-license.txt'),
    ],
  ),
  _Credit(
    'GeoNames',
    'Cities and time zones',
    'Data from GeoNames, licensed under CC BY 4.0.',
    [('geonames.org', 'https://www.geonames.org/'), _cc],
  ),
  _Credit(
    'World Bank',
    'Population (World Development Indicators)',
    'Data from World Bank Open Data, licensed under CC BY 4.0.',
    [('data.worldbank.org', 'https://data.worldbank.org/'), _cc],
  ),
  _Credit(
    'U.S. Department of State',
    'Travel advisories, visa and entry requirements',
    'Public domain. Not affiliated with or endorsed by the U.S. Department of State.',
    [('travel.state.gov', 'https://travel.state.gov/')],
  ),
  _Credit(
    'ExchangeRate-API',
    'Currency rates',
    'Approximate, updated daily. Not for financial transactions.',
    [('exchangerate-api.com', 'https://www.exchangerate-api.com/')],
  ),
  _Credit(
    'National censuses and surveys',
    'Language speaker percentages',
    'Figures from each country\'s statistics office or survey (including '
        'Eurobarometer, Morocco\'s HCP, CC BY 4.0, Insee, Licence '
        'Ouverte 2.0, Kyrgyzstan\'s National Statistical Committee, '
        'CC BY-NC-SA 4.0, and the ABS and Stats NZ, CC BY 4.0), linked under '
        'each country\'s Languages card. Percentages are calculated from the '
        'published tables. Percentages derived from Kyrgyzstan\'s figures are '
        'shared under CC BY-NC-SA 4.0. Contains public sector information licensed under '
        'the Open Government Licence v3.0 (ONS, NISRA).',
    [
      _cc,
      ('CC BY-NC-SA 4.0', 'https://creativecommons.org/licenses/by-nc-sa/4.0/'),
      ('OGL v3.0', 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'),
    ],
  ),
  _Credit(
    'Flagpedia',
    'Flag images',
    'Public-domain flags served via flagcdn.com.',
    [('flagpedia.net', 'https://flagpedia.net/')],
  ),
];

class _CreditsCard extends StatelessWidget {
  const _CreditsCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AccordionTheme.white,
        borderRadius: BorderRadius.circular(AccordionTheme.cardRadius),
        boxShadow: AccordionTheme.cardShadow,
      ),
      child: Column(
        children: [
          for (var i = 0; i < _credits.length; i++)
            _CreditRow(credit: _credits[i], isLast: i == _credits.length - 1),
        ],
      ),
    );
  }
}

class _CreditRow extends StatelessWidget {
  final _Credit credit;
  final bool isLast;

  const _CreditRow({required this.credit, required this.isLast});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        border: isLast ? null : const Border(bottom: BorderSide(color: AccordionTheme.rule)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(credit.name, style: AccordionTheme.rowTitle),
          const SizedBox(height: 2),
          Text(credit.usedFor.toUpperCase(), style: AccordionTheme.sLabel),
          const SizedBox(height: 6),
          Text(credit.notice, style: AccordionTheme.sBody.copyWith(fontSize: 14)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 14,
            runSpacing: 4,
            children: [
              for (final (label, url) in credit.links)
                ExternalLink(
                  label: label,
                  url: url,
                  color: AccordionTheme.skyDark,
                  fontFamily: AccordionTheme.dmMono,
                ),
            ],
          ),
        ],
      ),
    );
  }
}
