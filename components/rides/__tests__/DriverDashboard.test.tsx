import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { DEMO_DRIVER, DEMO_DRIVER_LEGS, DEMO_REQUESTS } from '@/lib/rides/mock';

import { DriverDashboard } from '../DriverDashboard';

async function renderDashboard() {
  const handlers = { onEdit: jest.fn(), onContact: jest.fn(), onCancel: jest.fn() };
  await render(
    <DriverDashboard
      contextLabel="Mariage de Léa et Samuel · 14 juin"
      driver={DEMO_DRIVER}
      legs={DEMO_DRIVER_LEGS}
      requests={DEMO_REQUESTS}
      {...handlers}
    />
  );
  return handlers;
}

describe('DriverDashboard', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('montre qui occupe la voiture et les places libres', async () => {
    await renderDashboard();

    expect(screen.getByText('Bonjour David')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Aller · 18h00–18h30' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Retour · 00h30' })).toBeOnTheScreen();
    expect(screen.getByText('Départ d’Ashdod')).toBeOnTheScreen();
    expect(screen.getByText('1 place libre')).toBeOnTheScreen();
    expect(screen.getByText('Esther')).toBeOnTheScreen();
    expect(screen.getByText('Esther +1')).toBeOnTheScreen();
    expect(screen.getByText('Libre')).toBeOnTheScreen();
  });

  it('note une place prise puis la libère', async () => {
    await renderDashboard();

    await fireEvent.press(screen.getByRole('button', { name: 'Une place prise' }));
    expect(screen.getByText('Complet')).toBeOnTheScreen();
    expect(screen.getByText('Prise')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Une place prise' })).toBeDisabled();

    await fireEvent.press(screen.getByRole('button', { name: 'Libérer une place' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Libérer une place' }));
    expect(screen.getByText('2 places libres')).toBeOnTheScreen();
  });

  it('liste les passagers du sens choisi et permet de les contacter', async () => {
    const { onContact, onCancel } = await renderDashboard();

    expect(screen.getByText('Ils cherchent depuis Ashdod')).toBeOnTheScreen();
    expect(screen.getByText('Nathan Bensoussan')).toBeOnTheScreen();
    expect(screen.getByText('1 personne · Centre-ville')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Retour · 00h30' }));
    expect(screen.getByText('Retour vers Ashdod')).toBeOnTheScreen();
    expect(screen.queryByText('Nathan Bensoussan')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Contacter' }));
    expect(onContact).toHaveBeenCalledWith(expect.objectContaining({ id: 'req-rachel-back' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Je ne peux plus conduire' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
