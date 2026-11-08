import i18n from '@/lib/i18n';

import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { ESTHER, ESTHER_MATCHES, ESTHER_STATUS } from '@/lib/data/__fixtures__/demo';
import type { RideMatch } from '@/lib/rides/types';

import { DriverList, type PassengerLegStatus } from '../DriverList';

async function renderList(
  status: Partial<Record<'outbound' | 'return', PassengerLegStatus>> = {},
  matches: RideMatch[] = ESTHER_MATCHES
) {
  const handlers = {
    onOpenRide: jest.fn(),
    onEdit: jest.fn(),
    onBack: jest.fn(),
    onFound: jest.fn(),
    onSearchAgain: jest.fn(),
  };
  await render(
    <DriverList
      contextLabel="Mariage de Léa et Samuel · 14 juin"
      passenger={ESTHER}
      matches={matches}
      directions={['outbound', 'return']}
      status={status}
      {...handlers}
    />
  );
  return handlers;
}

const cardNames = () =>
  screen
    .getAllByRole('button')
    .map((button) => button.props.accessibilityLabel as string | undefined)
    .filter((label): label is string => Boolean(label?.includes(', ')));

describe('DriverList', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('présente le passager et les places libres dans sa ville', async () => {
    await renderList();

    expect(screen.getByText('Bonjour Esther · vous êtes 2')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Rova Gimel, Ashdod' })).toBeOnTheScreen();
    expect(screen.getByText('2 places libres près de chez toi')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Aller · 2 places' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Retour · 4 places' })).not.toBeSelected();
  });

  it('décrit chaque départ, les villes voisines avec leur distance, les voitures complètes en dernier', async () => {
    await renderList();

    const names = cardNames();
    expect(names[0]).toBe('David Cohen, Part entre 18h00 et 18h30 · Rova HaKirya, 1 libre');
    expect(names[1]).toBe('Myriam Benhamou, Part entre 18h15 et 18h45 · Rova Yod Alef, 1 libre');
    expect(names[2]).toMatch(/^Ruth Azoulay, Gan Yavne, à \d+ km · vers 18h00, 2 libres$/);
    expect(names[3]).toBe('Yoni Attal, Part vers 17h45 · Rova Alef, Complet');
  });

  it('change de liste avec les onglets', async () => {
    await renderList();

    await fireEvent.press(screen.getByRole('tab', { name: 'Retour · 4 places' }));

    expect(screen.getByText('4 places libres près de chez toi')).toBeOnTheScreen();
    expect(screen.queryByText('Yoni Attal')).toBeNull();
    expect(screen.getByText('Sarah Levy')).toBeOnTheScreen();
  });

  it('ne propose que les voitures où tout le groupe tient, ou une autre solution', async () => {
    const { onFound } = await renderList();

    await fireEvent.press(screen.getByRole('button', { name: 'J’ai trouvé ma place' }));
    expect(screen.getByRole('button', { name: 'Avec Ruth Azoulay' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Avec David Cohen' })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Avec Ruth Azoulay' }));
    expect(onFound).toHaveBeenCalledWith('outbound', 'd-ruth-out');

    await fireEvent.press(screen.getByRole('button', { name: 'J’ai trouvé ma place' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Autrement (ami, taxi…)' }));
    expect(onFound).toHaveBeenLastCalledWith('outbound', null);
  });

  it('dit avec qui on part, et permet de chercher à nouveau', async () => {
    const { onSearchAgain } = await renderList(ESTHER_STATUS);

    expect(screen.getByText('Tu pars avec David C.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Je cherche à nouveau' }));
    expect(onSearchAgain).toHaveBeenCalledWith('outbound');
  });

  it('ouvre la fiche trajet et revient à l’inscription', async () => {
    const { onOpenRide, onEdit, onBack } = await renderList();

    const card = screen.getByRole('button', { name: /^Myriam Benhamou/ });
    expect(within(card).getByText('1 libre')).toBeOnTheScreen();
    await fireEvent.press(card);
    expect(onOpenRide).toHaveBeenCalledWith(expect.objectContaining({ id: 'd-myriam-out' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Modifier' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('prévient quand aucun conducteur ne passe près de chez soi', async () => {
    await renderList({}, []);
    expect(screen.getByText('Pas encore de place libre près de chez toi')).toBeOnTheScreen();
    expect(screen.getByText('Aucun conducteur pour ce trajet pour l’instant.')).toBeOnTheScreen();
  });
});
