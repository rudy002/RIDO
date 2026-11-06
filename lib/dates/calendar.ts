import type { Language } from '@/lib/i18n';

/** Premier jour de la semaine : lundi en France, dimanche en Israël et aux États-Unis. */
export const WEEK_STARTS_ON: Record<Language, 0 | 1> = { fr: 1, he: 0, en: 0 };

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** Même jour, à l'heure (et au décalage de jours) de `time` par rapport à `reference`. */
export function moveToDay(time: Date, reference: Date, day: Date): Date {
  const offsetDays = Math.round(
    (startOfDay(time).getTime() - startOfDay(reference).getTime()) / 86_400_000
  );
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate() + offsetDays,
    time.getHours(),
    time.getMinutes()
  );
}

/** Semaines d'un mois : 7 cases chacune, `null` hors du mois. */
export function monthWeeks(month: Date, weekStartsOn: 0 | 1): (Date | null)[][] {
  const year = month.getFullYear();
  const index = month.getMonth();
  const daysInMonth = new Date(year, index + 1, 0).getDate();
  const leading = (new Date(year, index, 1).getDay() - weekStartsOn + 7) % 7;

  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, day) => new Date(year, index, day + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}
