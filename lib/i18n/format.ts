import type { Language } from './index';

const LOCALES: Record<Language, string> = {
  fr: 'fr-FR',
  he: 'he-IL',
  en: 'en-US',
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Heure selon la langue : « 19h30 » en français, format local ailleurs (« 7:30 PM », « 19:30 »). */
export function formatTime(date: Date, language: Language): string {
  if (language === 'fr') return `${pad(date.getHours())}h${pad(date.getMinutes())}`;
  return new Intl.DateTimeFormat(LOCALES[language], {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Heure courte, sans minutes pile : « 18h », « 01h », « 19h30 » ; « 6 PM » en anglais. */
export function formatShortTime(date: Date, language: Language): string {
  if (date.getMinutes() !== 0 || language === 'he') return formatTime(date, language);
  if (language === 'fr') return `${pad(date.getHours())}h`;
  return new Intl.DateTimeFormat(LOCALES[language], { hour: 'numeric' }).format(date);
}

/** Créneau horaire court : « 18h–19h30 ». */
export function formatTimeWindow(from: Date, to: Date, language: Language): string {
  return `${formatShortTime(from, language)}–${formatShortTime(to, language)}`;
}

/** Jour de la semaine et date (« Samedi 14 juin »), avec majuscule initiale. */
export function formatDay(date: Date, language: Language): string {
  const locale = LOCALES[language];
  const day = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return day.charAt(0).toLocaleUpperCase(locale) + day.slice(1);
}

/** « Samedi 14 juin · 19h30 – 01h00 » */
export function formatSchedule(start: Date, end: Date, language: Language): string {
  return `${formatDay(start, language)} · ${formatTime(start, language)} – ${formatTime(end, language)}`;
}

/** Date courte, sans le jour de la semaine : « 14 juin », « June 14 ». */
export function formatShortDate(date: Date, language: Language): string {
  return new Intl.DateTimeFormat(LOCALES[language], { day: 'numeric', month: 'long' }).format(date);
}

/** Jour court et date : « Sam. 14/06 », « Sat, 06/14 ». */
export function formatShortDay(date: Date, language: Language): string {
  const locale = LOCALES[language];
  const text = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** Mois et année : « Juin 2025 ». */
export function formatMonth(date: Date, language: Language): string {
  const locale = LOCALES[language];
  const text = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** Initiale courte d'un jour de semaine, pour l'en-tête du calendrier (« lun. », « Mon »). */
export function formatWeekday(date: Date, language: Language): string {
  return new Intl.DateTimeFormat(LOCALES[language], { weekday: 'short' }).format(date);
}

/** Jour abrégé et date en toutes lettres : « Sam. 14 juin ». */
export function formatShortWeekdayDate(date: Date, language: Language): string {
  const locale = LOCALES[language];
  const text = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}
