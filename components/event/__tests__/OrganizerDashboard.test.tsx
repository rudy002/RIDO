import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  WEDDING as DEMO_EVENT,
  WEDDING_OVERVIEW as DEMO_OVERVIEW,
} from '@/lib/data/__fixtures__/demo';
import type { DirectionOverview } from '@/lib/events/types';

import { OrganizerDashboard } from '../OrganizerDashboard';

async function renderDashboard(
  overview: Partial<Record<'outbound' | 'return', DirectionOverview>> = DEMO_OVERVIEW
) {
  const handlers = {
    onSwitchEvent: jest.fn(),
    onShare: jest.fn(),
    onRelaunch: jest.fn(),
    onJoin: jest.fn(),
    onOpenMyRide: jest.fn(),
  };
  await render(
    <OrganizerDashboard event={DEMO_EVENT} overview={overview} eventsCount={2} {...handlers} />
  );
  return handlers;
}

describe('OrganizerDashboard', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('résume l’événement et les chiffres de l’aller', async () => {
    await renderDashboard();

    expect(screen.getByRole('button', { name: 'Mes événements · 2' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Mariage de Léa et Samuel' })).toBeOnTheScreen();
    expect(screen.getByText('Sam. 14 juin · 19h30 – 01h00 · 18 inscrits')).toBeOnTheScreen();
    expect(screen.getByLabelText('6 conducteurs')).toBeOnTheScreen();
    expect(screen.getByLabelText('12 places libres')).toBeOnTheScreen();
    expect(screen.getByLabelText('3 sans solution')).toBeOnTheScreen();
    expect(screen.getByText('Sans solution pour l’aller')).toBeOnTheScreen();
    expect(screen.getByText('Ashkelon · 2 personnes')).toBeOnTheScreen();
  });

  it('écrit l’état de chaque zone, pas seulement sa couleur', async () => {
    await renderDashboard();

    expect(screen.getByLabelText('Ashdod, 2 places · 2 demandes')).toBeOnTheScreen();
    expect(screen.getByLabelText('Ashkelon, 0 place · 3 demandes')).toBeOnTheScreen();
  });

  it('passe au retour, avec ses propres chiffres', async () => {
    await renderDashboard();

    await fireEvent.press(screen.getByRole('tab', { name: 'Retour' }));

    expect(screen.getByText('Sans solution pour le retour')).toBeOnTheScreen();
    expect(screen.getByText('Michaël Ohana')).toBeOnTheScreen();
    expect(screen.queryByText('Paul Amsellem')).toBeNull();
    expect(screen.getByLabelText('4 conducteurs')).toBeOnTheScreen();
  });

  it('félicite quand tout le monde a une solution', async () => {
    const outbound = DEMO_OVERVIEW.outbound!;
    await renderDashboard({ outbound: { ...outbound, unmatched: [] } });

    expect(screen.getByText('Tout le monde a une solution.')).toBeOnTheScreen();
    expect(screen.getByLabelText('0 sans solution')).toBeOnTheScreen();
  });

  it('transmet les actions', async () => {
    const { onRelaunch, onShare, onJoin, onSwitchEvent } = await renderDashboard();

    await fireEvent.press(screen.getAllByRole('button', { name: 'Relancer' })[0]);
    await fireEvent.press(screen.getByRole('button', { name: 'Partager le lien' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Moi aussi, je viens : conducteur ou passager' })
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Mes événements · 2' }));

    expect(onRelaunch).toHaveBeenCalledWith(expect.objectContaining({ name: 'Paul Amsellem' }));
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onJoin).toHaveBeenCalledTimes(1);
    expect(onSwitchEvent).toHaveBeenCalledTimes(1);
  });

  it('invite à partager le lien tant que personne n’est inscrit', async () => {
    const handlers = {
      onSwitchEvent: jest.fn(),
      onShare: jest.fn(),
      onRelaunch: jest.fn(),
      onJoin: jest.fn(),
      onOpenMyRide: jest.fn(),
    };
    const empty = { drivers: 0, freeSeats: 0, unmatched: [], zones: [] };
    await render(
      <OrganizerDashboard
        event={{ ...DEMO_EVENT, guestsCount: 0 }}
        overview={{ outbound: empty, return: empty }}
        eventsCount={1}
        {...handlers}
      />
    );

    expect(screen.getByText(/Personne n’est encore inscrit/)).toBeOnTheScreen();
    expect(screen.queryByText('Tout le monde a une solution.')).toBeNull();
    expect(screen.queryByText('Par zone de départ')).toBeNull();
  });

  it('mène l’organisateur déjà inscrit à son trajet', async () => {
    const onOpenMyRide = jest.fn();
    await render(
      <OrganizerDashboard
        event={DEMO_EVENT}
        overview={DEMO_OVERVIEW}
        eventsCount={2}
        registeredAs="driver"
        onSwitchEvent={jest.fn()}
        onShare={jest.fn()}
        onRelaunch={jest.fn()}
        onJoin={jest.fn()}
        onOpenMyRide={onOpenMyRide}
      />
    );

    expect(screen.queryByRole('button', { name: /Moi aussi/ })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Voir ma voiture' }));
    expect(onOpenMyRide).toHaveBeenCalledTimes(1);
  });
});
