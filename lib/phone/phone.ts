import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import fr from 'i18n-iso-countries/langs/fr.json';
import he from 'i18n-iso-countries/langs/he.json';
import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';

import type { Language } from '@/lib/i18n';

export type { CountryCode };

countries.registerLocale(fr);
countries.registerLocale(he);
countries.registerLocale(en);

export type Country = {
  code: CountryCode;
  name: string;
  /** Indicatif avec le « + » : « +972 ». */
  callingCode: string;
  flag: string;
};

const REGIONAL_INDICATOR_A = 0x1f1e6;

function flagOf(code: CountryCode): string {
  return String.fromCodePoint(
    ...[...code].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65)
  );
}

export function callingCodeOf(code: CountryCode): string {
  return `+${getCountryCallingCode(code)}`;
}

export function countryOf(code: CountryCode, language: Language): Country {
  return {
    code,
    name: countries.getName(code, language) ?? code,
    callingCode: callingCodeOf(code),
    flag: flagOf(code),
  };
}

/** Tous les pays qui ont un nom dans la langue, triés par ordre alphabétique. */
export function listCountries(language: Language): Country[] {
  return getCountries()
    .filter((code) => countries.getName(code, language))
    .map((code) => countryOf(code, language))
    .sort((a, b) => a.name.localeCompare(b.name, language));
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Recherche par nom (sans tenir compte des accents) ou par indicatif (« 33 », « +33 »). */
export function searchCountries(list: Country[], query: string): Country[] {
  const needle = normalize(query);
  if (!needle) return list;
  const digits = needle.replace(/^\+/, '');
  return list.filter(
    (country) =>
      normalize(country.name).includes(needle) ||
      (/^\d+$/.test(digits) && country.callingCode.slice(1).startsWith(digits))
  );
}

/** Numéro d'exemple au format local, pour le placeholder (« 050-234-5678 »). */
export function examplePhoneOf(code: CountryCode): string {
  return getExampleNumber(code, examples)?.formatNational() ?? '';
}

export type PhoneInput = { country: CountryCode; national: string };

// Longueur maximale d'un numéro selon la norme internationale E.164.
const MAX_DIGITS = 15;

/**
 * Nettoie une saisie : ne garde que les chiffres, refuse un chiffre de plus quand le numéro
 * est déjà complet dans le pays, et reconnaît un numéro collé au format international (« +33… »).
 */
export function sanitizePhoneInput(text: string, current: PhoneInput): PhoneInput {
  if (text.trim().startsWith('+')) {
    const parsed = parsePhoneNumberFromString(text);
    if (parsed?.country) return { country: parsed.country, national: parsed.nationalNumber };
  }
  const digits = text.replace(/\D/g, '').slice(0, MAX_DIGITS);
  const next = { country: current.country, national: digits };
  const overflows =
    digits.length > current.national.length &&
    toInternational(current) !== null &&
    toInternational(next) === null;
  return overflows ? current : next;
}

/** Numéro au format international (« +972521234567 »), ou null s'il n'est pas valide. */
export function toInternational({ country, national }: PhoneInput): string | null {
  const parsed = parsePhoneNumberFromString(national, country);
  return parsed?.isValid() ? parsed.number : null;
}
