import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';

import { BackendError } from '@/lib/backend/errors';
import * as remote from '@/lib/backend/remote';
import { fetchEventPreview, fetchServerData } from '@/lib/backend/sync';
import { buildDemoData, DEMO_USER_ID, emptyData } from '@/lib/data/demo';
import type { AppData, EventPreview } from '@/lib/data/types';
import type { RideDraft } from '@/lib/rides/types';

import * as commands from '../commands';
import {
  connectBackend,
  dismissSyncError,
  getAppData,
  getSyncError,
  loadAppData,
  loadEventPreview,
  refresh,
} from '../store';

jest.mock('@/lib/backend/sync');
jest.mock('@/lib/backend/remote');

const fetchData = jest.mocked(fetchServerData);
const fetchPreview = jest.mocked(fetchEventPreview);
const server = jest.mocked(remote);

const client = {} as SupabaseClient;
const backend = { user: jest.fn(), forget: jest.fn() };

/** Données « du serveur » : la démo, au nom d'un vrai compte. */
function serverData(userId = 'user-1'): AppData {
  const demo = buildDemoData();
  const swap = (id: string) => (id === DEMO_USER_ID ? userId : id);
  return {
    ...demo,
    userId,
    events: demo.events.map((event) => ({ ...event, organizerId: swap(event.organizerId) })),
    participants: demo.participants.map((p) => ({ ...p, userId: swap(p.userId) })),
  };
}

const draft: RideDraft = {
  role: 'passenger',
  directions: ['outbound'],
  zone: { placeId: '295629', name: 'Ashdod' },
  firstName: 'Paul',
  lastName: 'Test',
  phone: '+972521234567',
  partySize: 1,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  backend.user.mockResolvedValue({ client, userId: 'user-1' });
  backend.forget.mockResolvedValue(undefined);
  fetchData.mockResolvedValue(serverData());
  connectBackend(backend);
  dismissSyncError();
});

afterAll(() => connectBackend(null));

describe('données venues du serveur', () => {
  it('n’installe jamais la démo : la copie enregistrée s’affiche, puis le serveur la remplace', async () => {
    await AsyncStorage.setItem('rido.data', JSON.stringify(buildDemoData()));
    fetchData.mockResolvedValue(emptyData('user-1'));
    await loadAppData();
    expect(getAppData().events).toEqual([]); // démo enregistrée ignorée
    await refresh();
    expect(getAppData().userId).toBe('user-1');
  });

  it('garde la copie du compte sur l’appareil pour le prochain lancement', async () => {
    await refresh();
    const stored = { ...serverData(), events: serverData().events.slice(0, 1) };
    await AsyncStorage.setItem('rido.data', JSON.stringify(stored));
    const slow = deferred<AppData>(); // serveur lent
    fetchData.mockReturnValue(slow.promise);
    await loadAppData();
    expect(getAppData().events).toHaveLength(1);
    slow.resolve(serverData());
    await refresh();
    expect(getAppData().events.length).toBeGreaterThan(1);
  });

  it('un serveur qui ne répond jamais n’empêche pas les relectures suivantes', async () => {
    jest.useFakeTimers();
    try {
      fetchData.mockReturnValueOnce(new Promise(() => undefined));
      const stuck = refresh();
      jest.advanceTimersByTime(20_000);
      await expect(stuck).rejects.toMatchObject({ kind: 'offline' });
    } finally {
      jest.useRealTimers();
    }
    fetchData.mockResolvedValue(serverData('user-1'));
    await expect(refresh()).resolves.toBeUndefined();
    expect(getAppData().userId).toBe('user-1');
  });

  it('affiche l’action aussitôt, puis la vérité du serveur', async () => {
    await refresh();
    const answer = deferred<void>();
    server.markFound.mockReturnValue(answer.promise);
    const passenger = getAppData().participants.find(
      (p) => p.userId === 'user-1' && p.role === 'passenger'
    );
    if (!passenger) throw new Error('passager absent');
    const leg = getAppData().passengerLegs.find(
      (l) => l.participantId === passenger.id && l.foundWith === undefined
    );
    if (!leg) throw new Error('recherche absente');

    const done = commands.markFound(passenger.eventId, leg.direction, null);
    // Avant la réponse du serveur, l'écran montre déjà la place trouvée.
    expect(getAppData().passengerLegs.find((l) => l.id === leg.id)?.foundWith).toBeNull();
    answer.resolve();
    await expect(done).resolves.toBe(true);
    expect(server.markFound).toHaveBeenCalledWith(client, passenger.eventId, leg.direction, null);
    expect(fetchData).toHaveBeenCalledTimes(2);
  });

  it('en cas de refus, revient à la vérité du serveur et dit pourquoi', async () => {
    await refresh();
    const truth = getAppData();
    server.markFound.mockRejectedValue(new BackendError('full', 'not enough free seats'));
    const passenger = truth.participants.find(
      (p) => p.userId === 'user-1' && p.role === 'passenger'
    );
    if (!passenger) throw new Error('passager absent');
    const car = truth.driverLegs.find((leg) => leg.eventId === passenger.eventId);
    if (!car) throw new Error('voiture absente');

    await expect(commands.markFound(passenger.eventId, car.direction, car.id)).resolves.toBe(false);
    expect(getAppData()).toEqual(truth);
    expect(getSyncError()).toBe('full');
  });

  it('sans réseau, revient à ce qu’il y avait avant l’action', async () => {
    await refresh();
    const before = getAppData();
    server.cancelDriving.mockRejectedValue(new BackendError('offline', 'Network request failed'));
    fetchData.mockRejectedValue(new BackendError('offline', 'Network request failed'));
    const driver = before.participants.find((p) => p.userId === 'user-1' && p.role === 'driver');
    if (!driver) throw new Error('conducteur absent');

    await expect(commands.cancelDriving(driver.eventId)).resolves.toBe(false);
    expect(getAppData()).toBe(before);
    expect(getSyncError()).toBe('offline');
  });

  it('n’efface pas une action en cours avec une relecture partie avant elle', async () => {
    await refresh();
    const slowRead = deferred<AppData>();
    fetchData.mockReturnValueOnce(slowRead.promise);
    const reading = refresh();
    const answer = deferred<void>();
    server.searchAgain.mockReturnValue(answer.promise);
    const passenger = getAppData().participants.find(
      (p) => p.userId === 'user-1' && p.role === 'passenger'
    );
    if (!passenger) throw new Error('passager absent');
    const found = getAppData().passengerLegs.find(
      (l) => l.participantId === passenger.id && l.foundWith !== undefined
    );
    if (!found) throw new Error('place absente');

    const action = commands.searchAgain(passenger.eventId, found.direction);
    slowRead.resolve(serverData()); // ancienne version : la place y est encore
    await reading;
    expect(getAppData().passengerLegs.find((l) => l.id === found.id)).not.toHaveProperty(
      'foundWith'
    );
    const { foundWith: _foundWith, ...searching } = found;
    fetchData.mockResolvedValue({
      ...serverData(),
      passengerLegs: serverData().passengerLegs.map((l) => (l.id === found.id ? searching : l)),
    });
    answer.resolve();
    await expect(action).resolves.toBe(true);
    expect(getAppData().passengerLegs.find((l) => l.id === found.id)).toEqual(searching);
  });
});

describe('actions envoyées au serveur', () => {
  beforeEach(async () => {
    await refresh();
  });

  it('crée un événement avec le lien choisi par le serveur', async () => {
    server.createEvent.mockResolvedValue('mariage-0123');
    const id = await commands.createEvent(
      {
        type: 'wedding',
        name: 'Mariage',
        venue: 'Domaine',
        startsAt: new Date('2027-06-14T16:00:00Z'),
        endsAt: new Date('2027-06-14T22:00:00Z'),
        directions: ['outbound'],
      },
      'IL'
    );
    expect(id).toBe('mariage-0123');
    expect(server.createEvent).toHaveBeenCalledWith(
      client,
      expect.objectContaining({ name: 'Mariage' }),
      'IL',
      'David Cohen'
    );
  });

  it('ne donne pas de lien si la création est refusée', async () => {
    server.createEvent.mockRejectedValue(new BackendError('offline', 'Failed to fetch'));
    fetchData.mockRejectedValue(new BackendError('offline', 'Failed to fetch'));
    const id = await commands.createEvent(
      {
        type: 'other',
        name: 'Fête',
        venue: 'Ici',
        startsAt: new Date('2027-06-14T16:00:00Z'),
        endsAt: new Date('2027-06-14T22:00:00Z'),
        directions: ['outbound'],
      },
      'IL'
    );
    expect(id).toBeNull();
  });

  it('à la première inscription, garde aussi le profil', async () => {
    fetchData.mockResolvedValue(emptyData('user-1'));
    await refresh();
    server.joinEvent.mockResolvedValue('participant-1');
    server.saveProfile.mockResolvedValue(undefined);
    await expect(commands.joinEvent('fete-0123', draft)).resolves.toBe(true);
    expect(server.joinEvent).toHaveBeenCalledWith(client, 'fete-0123', draft);
    expect(server.saveProfile).toHaveBeenCalledWith(
      client,
      'user-1',
      expect.objectContaining({ firstName: 'Paul', phone: '+972521234567' })
    );
  });

  it('une inscription reste valable même si le profil n’a pas pu être gardé', async () => {
    fetchData.mockResolvedValue(emptyData('user-1'));
    await refresh();
    server.joinEvent.mockResolvedValue('participant-1');
    server.saveProfile.mockRejectedValue(new BackendError('unknown', 'oops'));
    await expect(commands.joinEvent('fete-0123', draft)).resolves.toBe(true);
  });

  it('traduit les places notées et libérées en appels au serveur', async () => {
    server.takeSeat.mockResolvedValue(undefined);
    server.releaseSeat.mockResolvedValue(undefined);
    const paul = { id: 'b1', name: 'Paul', seats: 1, passengerLegId: 'leg-paul' };
    const manual = { id: 'b2', seats: 1 };
    await commands.changeSeats('car-1', [paul, manual], [paul, manual, { id: 'new', seats: 1 }]);
    expect(server.takeSeat).toHaveBeenCalledTimes(1);
    expect(server.releaseSeat).not.toHaveBeenCalled();
    await commands.changeSeats('car-1', [paul, manual], [paul]);
    expect(server.releaseSeat).toHaveBeenCalledTimes(1);
  });

  it('« Se déconnecter » efface le compte et repart d’un compte neuf', async () => {
    server.deleteAccount.mockResolvedValue(undefined);
    fetchData.mockResolvedValue(emptyData('user-2'));
    await expect(commands.signOut()).resolves.toBe(true);
    expect(server.deleteAccount).toHaveBeenCalledWith(client);
    expect(backend.forget).toHaveBeenCalled();
    expect(getAppData()).toMatchObject({ userId: 'user-2', events: [], profile: null });
  });

  it('sans réseau, « Se déconnecter » n’efface rien', async () => {
    server.deleteAccount.mockRejectedValue(new BackendError('offline', 'Failed to fetch'));
    const before = getAppData();
    await expect(commands.signOut()).resolves.toBe(false);
    expect(backend.forget).not.toHaveBeenCalled();
    expect(getAppData()).toBe(before);
  });
});

describe('lien reçu', () => {
  const preview: EventPreview = {
    event: {
      id: 'fete-0123',
      type: 'birthday',
      title: 'Les 30 ans de Noa',
      startsAt: new Date('2027-06-20T17:00:00Z'),
      endsAt: new Date('2027-06-20T22:00:00Z'),
      venue: 'Rooftop',
      country: 'IL',
      directions: ['outbound'],
      organizerId: '',
    },
    guestsCount: 3,
    seatsOffered: 2,
    zones: [],
  };

  it('demande l’invitation au serveur et la garde', async () => {
    fetchPreview.mockResolvedValue(preview);
    await expect(loadEventPreview('fete-0123')).resolves.toBe(true);
    expect(getAppData().previews).toEqual([preview]);
    // Relue avec les données : le serveur sait quels aperçus garder.
    await refresh();
    expect(fetchData).toHaveBeenLastCalledWith(client, 'user-1', [preview]);
  });

  it('un lien inconnu ne mène à rien', async () => {
    fetchPreview.mockResolvedValue(null);
    await expect(loadEventPreview('inconnu')).resolves.toBe(false);
  });
});
