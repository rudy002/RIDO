import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEMO_EVENT, DEMO_OVERVIEW } from '@/lib/events/mock';

import { OrganizerDashboard } from '../OrganizerDashboard';

async function renderDashboard() {
  const handlers = {
    onSwitchEvent: jest.fn(),
    onShare: jest.fn(),
    onRelaunch: jest.fn(),
    onJoin: jest.fn(),
  };
  await render(
    <OrganizerDashboard event={DEMO_EVENT} overview={DEMO_OVERVIEW} eventsCount={2} {...handlers} />
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
    expect(screen.getByText('Sam. 14 juin · 19h30 – 01h00 · 23 inscrits')).toBeOnTheScreen();
    expect(screen.getByLabelText('6 conducteurs')).toBeOnTheScreen();
    expect(screen.getByLabelText('14 places libres')).toBeOnTheScreen();
    expect(screen.getByLabelText('3 sans solution')).toBeOnTheScreen();
    expect(screen.getByText('Sans solution pour l’aller')).toBeOnTheScreen();
    expect(screen.getByText('Ashkelon · 2 personnes')).toBeOnTheScreen();
  });

  it('écrit l’état de chaque zone, pas seulement sa couleur', async () => {
    await renderDashboard();

    expect(screen.getByLabelText('Ashdod, 6 places · 3 demandes')).toBeOnTheScreen();
    expect(screen.getByLabelText('Ashkelon, 0 place · 3 demandes')).toBeOnTheScreen();
  });

  it('passe au retour et félicite quand tout le monde a une solution', async () => {
    await renderDashboard();

    await fireEvent.press(screen.getByRole('tab', { name: 'Retour' }));

    expect(screen.getByText('Sans solution pour le retour')).toBeOnTheScreen();
    expect(screen.getByText('Tout le monde a une solution.')).toBeOnTheScreen();
    expect(screen.queryByText('Paul Amsellem')).toBeNull();
    expect(screen.getByLabelText('5 conducteurs')).toBeOnTheScreen();
  });

  it('transmet les actions', async () => {
    const { onRelaunch, onShare, onJoin, onSwitchEvent } = await renderDashboard();

    await fireEvent.press(screen.getAllByRole('button', { name: 'Relancer' })[0]);
    await fireEvent.press(screen.getByRole('button', { name: 'Partager le lien' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Moi aussi, je viens : conducteur ou passager' })
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Mes événements · 2' }));

    expect(onRelaunch).toHaveBeenCalledWith(expect.objectContaining({ id: 'paul' }));
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onJoin).toHaveBeenCalledTimes(1);
    expect(onSwitchEvent).toHaveBeenCalledTimes(1);
  });
});
