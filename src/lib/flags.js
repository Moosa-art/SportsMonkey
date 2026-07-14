// Maps country / nationality / league names to real flag image URLs.
// Used to replace emoji flags in the football sections (Live, Match Detail,
// Transfer Target). The Table tab and Stories already use flag images that the
// live APIs return directly; this helper covers the mock/DB-backed sections
// that don't expose a flag field.
//
// flagcdn serves lightweight PNG flags keyed by ISO 3166-1 alpha-2 codes
// (plus gb-eng / gb-sct / gb-wls for the home nations). The base is assembled
// from parts on purpose so the literal isn't rewritten by URL tooling.

const FLAG_BASE = 'https://' + 'flagcdn.com' + '/w40/';

const COUNTRY_CODE = {
  France: 'fr', England: 'gb-eng', Scotland: 'gb-sct', Wales: 'gb-wls',
  Spain: 'es', Germany: 'de', Brazil: 'br', Argentina: 'ar', Portugal: 'pt',
  Netherlands: 'nl', Italy: 'it', Belgium: 'be', Norway: 'no', Denmark: 'dk',
  Sweden: 'se', Turkey: 'tr', Croatia: 'hr', Austria: 'at', Russia: 'ru',
  Ukraine: 'ua', Iran: 'ir', Ireland: 'ie', Switzerland: 'ch', Poland: 'pl',
  Greece: 'gr', Serbia: 'rs', Japan: 'jp', 'United States': 'us', Mexico: 'mx',
};

// Leagues -> the country whose flag represents them.
const LEAGUE_COUNTRY = {
  'Premier League': 'England', Championship: 'England', 'La Liga': 'Spain',
  Bundesliga: 'Germany', 'Serie A': 'Italy', 'Ligue 1': 'France',
  'Pro League': 'Belgium', Allsvenskan: 'Sweden', Eredivisie: 'Netherlands',
  'Primeira Liga': 'Portugal', Eliteserien: 'Norway', Superligaen: 'Denmark',
};

export function countryFlag(name) {
  if (!name) return null;
  const code = COUNTRY_CODE[String(name).trim()];
  if (!code) return null;
  return FLAG_BASE + code + '.png';
}

export function leagueFlag(name) {
  if (!name) return null;
  return countryFlag(LEAGUE_COUNTRY[String(name).trim()] || name);
}
