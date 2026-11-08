import type { AppData } from './types';
import { myParticipant } from './selectors';

/** Où mène un trajet de l'utilisateur : sa voiture (conducteur) ou les conducteurs (passager). */
export function myRidePath(data: AppData, eventId: string) {
  const me = myParticipant(data, eventId);
  if (!me) return { pathname: '/e/[id]' as const, params: { id: eventId } };
  return me.role === 'driver'
    ? { pathname: '/e/[id]/my-car' as const, params: { id: eventId } }
    : { pathname: '/e/[id]/rides' as const, params: { id: eventId } };
}
