const MINUTE = 60_000;

export const SLOT_MINUTES = 15;

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE);
}

/** Créneaux de 15 min de `from` à `to` inclus, alignés sur le quart d'heure. */
export function timeSlots(from: Date, to: Date, stepMinutes = SLOT_MINUTES): Date[] {
  const step = stepMinutes * MINUTE;
  const slots: Date[] = [];
  for (let time = Math.ceil(from.getTime() / step) * step; time <= to.getTime(); time += step) {
    slots.push(new Date(time));
  }
  return slots;
}

/** Après un changement du début, la fin reste après lui (créneau d'une demi-heure par défaut). */
export function keepWindowOrdered(
  window: { from: Date; to: Date },
  minimumMinutes = 2 * SLOT_MINUTES
): { from: Date; to: Date } {
  return window.to.getTime() < window.from.getTime()
    ? { from: window.from, to: addMinutes(window.from, minimumMinutes) }
    : window;
}
