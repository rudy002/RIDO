import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { ORGANIZED } from '@/lib/data/__fixtures__/demo';

import { MyEvents } from '../MyEvents';

const EVENTS = ORGANIZED.upcoming;

async function renderEvents(events = EVENTS) {
  const handlers = {
    onOpenDashboard: jest.fn(),
    onShare: jest.fn(),
    onOpenPast: jest.fn(),
    onCreate: jest.fn(),
  };
  await render(<MyEvents events={events} pastCount={2} {...handlers} />);
  return handlers;
}

describe('MyEvents', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('résume un événement qui a encore des besoins', async () => {
    await renderEvents();

    expect(screen.getByText('Ceux que tu organises')).toBeOnTheScreen();
    expect(screen.getByText('Mariage · sam. 14 juin')).toBeOnTheScreen();
    expect(screen.getByText('18 inscrits')).toBeOnTheScreen();
    expect(screen.getByLabelText('12 places libres')).toBeOnTheScreen();
    expect(screen.getByLabelText('3 sans solution')).toBeOnTheScreen();
  });

  it('félicite quand tout le monde a une place', async () => {
    await renderEvents();

    expect(screen.getByText('Bar/Bat mitzvah · sam. 5 juillet')).toBeOnTheScreen();
    expect(screen.getByText('Tout le monde a une place')).toBeOnTheScreen();
    // Un seul bouton de partage : celui de l'événement qui a encore des besoins.
    expect(screen.getAllByRole('button', { name: 'Partager le lien' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Tableau de bord' })).toHaveLength(2);
  });

  it('transmet les actions avec l’identifiant de l’événement', async () => {
    const handlers = await renderEvents();

    await fireEvent.press(screen.getAllByRole('button', { name: 'Tableau de bord' })[1]);
    await fireEvent.press(screen.getByRole('button', { name: 'Partager le lien' }));
    await fireEvent.press(screen.getByRole('button', { name: '2 événements terminés' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Créer un événement' }));

    expect(handlers.onOpenDashboard).toHaveBeenCalledWith('eitan');
    expect(handlers.onShare).toHaveBeenCalledWith('demo');
    expect(handlers.onOpenPast).toHaveBeenCalledTimes(1);
    expect(handlers.onCreate).toHaveBeenCalledTimes(1);
  });

  it('prévoit l’état vide', async () => {
    await renderEvents([]);
    expect(screen.getByText('Tu n’organises aucun événement')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Créer un événement' })).toBeOnTheScreen();
  });
});
