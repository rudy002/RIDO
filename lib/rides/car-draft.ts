import { z } from 'zod';

import { MAX_FREE_SEATS, MIN_FREE_SEATS, type CarDraft, type DriverLeg } from './types';

const windowSchema = z.object({ from: z.coerce.date(), to: z.coerce.date() });

const carDraftSchema = z.object({
  seats: z.number().int().min(MIN_FREE_SEATS).max(MAX_FREE_SEATS),
  legs: z.object({ outbound: windowSchema.optional(), return: windowSchema.optional() }),
});

/** Pour passer un trajet publié d'un écran à l'autre (paramètre de navigation), en attendant un serveur. */
export function serializeCarDraft(draft: CarDraft): string {
  return JSON.stringify(draft);
}

export function parseCarDraft(value: string | undefined): CarDraft | null {
  if (!value) return null;
  try {
    const parsed = carDraftSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Un trajet tout juste publié : la voiture est encore vide. */
export function legsOfDraft(draft: CarDraft): Partial<Record<keyof CarDraft['legs'], DriverLeg>> {
  return Object.fromEntries(
    Object.entries(draft.legs).map(([direction, window]) => [
      direction,
      { departure: window, totalSeats: draft.seats, bookings: [] },
    ])
  );
}
