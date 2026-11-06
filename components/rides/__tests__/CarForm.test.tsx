import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import type { TripDirection } from '@/lib/rides/types';

import { CarForm } from '../CarForm';

const at = (day: number, hours: number, minutes = 0) => new Date(2025, 5, day, hours, minutes);

const DEFAULTS = {
  outbound: { from: at(14, 18), to: at(14, 18, 30) },
  return: { from: at(15, 0, 30), to: at(15, 1) },
};

async function renderForm(directions: TripDirection[] = ['outbound', 'return']) {
  const onSubmit = jest.fn();
  await render(
    <CarForm
      directions={directions}
      defaults={DEFAULTS}
      outboundHint="L’événement commence à 19h30."
      onBack={jest.fn()}
      onSubmit={onSubmit}
    />
  );
  return onSubmit;
}

describe('CarForm', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('propose 3 places et les créneaux par défaut', async () => {
    await renderForm();

    expect(screen.getByText('Étape 2 sur 2')).toBeOnTheScreen();
    expect(screen.getByRole('adjustable', { name: '3 places libres' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Au plus tôt, 18h00' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Au plus tard, 18h30' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Au plus tôt, 00h30' })).toBeOnTheScreen();
    expect(screen.getByText('L’événement commence à 19h30.')).toBeOnTheScreen();
  });

  it('ne demande que les sens choisis à l’étape 1', async () => {
    await renderForm(['return']);

    expect(screen.queryByText('Aller : tu pars entre')).toBeNull();
    expect(screen.getByText('Retour : tu repars entre')).toBeOnTheScreen();
  });

  it('change l’heure et garde la fin après le début', async () => {
    const onSubmit = await renderForm(['outbound']);

    await fireEvent.press(screen.getByRole('button', { name: 'Au plus tôt, 18h00' }));
    await fireEvent.press(screen.getByRole('button', { name: '19h00' }));

    expect(screen.getByRole('button', { name: 'Au plus tôt, 19h00' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Au plus tard, 19h30' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Une place de plus' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Publier mon trajet' }));

    expect(onSubmit).toHaveBeenCalledWith({
      seats: 4,
      legs: { outbound: { from: at(14, 19), to: at(14, 19, 30) } },
    });
  });
});
