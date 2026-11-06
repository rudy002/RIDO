import i18n from '@/lib/i18n';

import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { DEMO_MATCHES, DEMO_PASSENGER } from '@/lib/rides/mock';

import { DriverList } from '../DriverList';

async function renderList() {
  const onOpenRide = jest.fn();
  const onEdit = jest.fn();
  const onFound = jest.fn();
  await render(
    <DriverList
      contextLabel="Mariage de Léa et Samuel · 14 juin"
      passenger={DEMO_PASSENGER}
      matches={DEMO_MATCHES}
      onEdit={onEdit}
      onOpenRide={onOpenRide}
      onFound={onFound}
    />
  );
  return { onOpenRide, onEdit, onFound };
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

  it('présente le passager et les places libres près de chez lui', async () => {
    await renderList();

    expect(screen.getByText('Bonjour Esther · vous êtes 2')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Ashdod' })).toBeOnTheScreen();
    expect(screen.getByText('4 places libres près de chez toi')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Aller · 4 places' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Retour · 6 places' })).not.toBeSelected();
  });

  it('décrit chaque départ et met les voitures complètes en dernier', async () => {
    await renderList();

    expect(cardNames()).toEqual([
      'David Cohen, Part entre 18h00 et 18h30 · Centre-ville, 3 libres',
      'Ruth Azoulay, Yavne, à 12 km · vers 18h00, 2 libres',
      'Myriam Benhamou, Part entre 18h15 et 18h45 · Youd-Alef, 1 libre',
      'Yoni Attal, Part vers 17h45 · La marina, Complet',
    ]);
  });

  it('change de liste avec les onglets', async () => {
    await renderList();

    await fireEvent.press(screen.getByRole('tab', { name: 'Retour · 6 places' }));

    expect(screen.getByRole('tab', { name: 'Retour · 6 places' })).toBeSelected();
    expect(screen.getByText('6 places libres près de chez toi')).toBeOnTheScreen();
    expect(screen.queryByText('Yoni Attal')).toBeNull();
    expect(screen.getByText('Sarah Levy')).toBeOnTheScreen();
  });

  it('ouvre la fiche trajet et transmet les actions du bas', async () => {
    const { onOpenRide, onEdit, onFound } = await renderList();

    const card = screen.getByRole('button', { name: /^Ruth Azoulay/ });
    expect(within(card).getByText('2 libres')).toBeOnTheScreen();
    await fireEvent.press(card);
    expect(onOpenRide).toHaveBeenCalledWith(expect.objectContaining({ id: 'out-ruth' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Modifier' }));
    await fireEvent.press(screen.getByRole('button', { name: 'J’ai trouvé ma place' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onFound).toHaveBeenCalledTimes(1);
  });
});
