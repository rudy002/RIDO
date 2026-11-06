import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEMO_UPCOMING_TRIPS } from '@/lib/trips/mock';

import { MyTrips } from '../MyTrips';

async function renderTrips(upcoming = DEMO_UPCOMING_TRIPS) {
  const handlers = { onOpenTrip: jest.fn(), onOpenPast: jest.fn() };
  await render(<MyTrips firstName="David" upcoming={upcoming} pastCount={3} {...handlers} />);
  return handlers;
}

describe('MyTrips', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('montre le trajet conducteur avec ses places libres', async () => {
    await renderTrips();

    expect(screen.getByText('Bonjour David')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Mes trajets' })).toBeOnTheScreen();
    expect(screen.getByText('Mariage · sam. 14 juin')).toBeOnTheScreen();
    expect(screen.getByText('Conducteur')).toBeOnTheScreen();
    expect(screen.getByText('Aller · 18h00–18h30')).toBeOnTheScreen();
    expect(screen.getByText('1 libre')).toBeOnTheScreen();
    expect(screen.getByText('Retour · 00h30–01h00')).toBeOnTheScreen();
    expect(screen.getByText('2 libres')).toBeOnTheScreen();
  });

  it('montre le trajet passager : avec qui, ou s’il cherche encore', async () => {
    await renderTrips();

    expect(screen.getByText('Passager')).toBeOnTheScreen();
    expect(screen.getByText('Aller · 20h15')).toBeOnTheScreen();
    expect(screen.getByText('Avec Myriam B.')).toBeOnTheScreen();
    expect(screen.getByText('Tu cherches encore')).toBeOnTheScreen();
  });

  it('ouvre un trajet et l’historique', async () => {
    const { onOpenTrip, onOpenPast } = await renderTrips();

    await fireEvent.press(screen.getByRole('button', { name: 'Les 30 ans de Noa, Passager' }));
    await fireEvent.press(screen.getByRole('button', { name: '3 trajets passés' }));

    expect(onOpenTrip).toHaveBeenCalledWith('trip-noa');
    expect(onOpenPast).toHaveBeenCalledTimes(1);
  });

  it('prévoit l’état vide', async () => {
    await renderTrips([]);

    expect(screen.getByText('Aucun trajet pour l’instant')).toBeOnTheScreen();
    expect(screen.queryByText('À venir')).toBeNull();
    expect(screen.getByText(/Tu as reçu un lien/)).toBeOnTheScreen();
  });
});
