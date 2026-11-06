import type { CountryCode } from '@/lib/phone/phone';
import type { TimeWindow, TripDirection, ZoneActivity } from '@/lib/rides/types';

export const EVENT_TYPES = ['wedding', 'barMitzvah', 'birthday', 'festival', 'other'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Ce qu'un invité voit d'un événement avant de rejoindre le covoiturage. */
export type EventSummary = {
  id: string;
  type: EventType;
  title: string;
  startsAt: Date;
  endsAt: Date;
  venue: string;
  /** Pays de l'événement : indicatif téléphonique proposé par défaut. */
  country: CountryCode;
  organizerName: string;
  seatsOffered: number;
  guestsCount: number;
  /** Créneau conseillé pour le trajet aller. */
  outboundWindow: TimeWindow;
  /** Heure approximative du retour. */
  returnAround: Date;
  activeZones: ZoneActivity[];
};

/** Ce que l'organisateur saisit pour créer un événement (O1). */
export type EventDraft = {
  type: EventType;
  name: string;
  venue: string;
  startsAt: Date;
  /** Après `startsAt` ; le lendemain si l'événement finit après minuit. */
  endsAt: Date;
  /** Trajets à organiser : l'aller, le retour ou les deux. */
  directions: TripDirection[];
};
