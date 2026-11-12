import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { DAVID_LEGS, DAVID_PASSENGERS, DAVID_REQUESTS } from '@/lib/data/__fixtures__/demo';
import type { Booking, DriverLeg, TripDirection } from '@/lib/rides/types';

import { DriverDashboard } from '../DriverDashboard';

const INITIAL: Partial<Record<TripDirection, DriverLeg>> = {
  outbound: DAVID_LEGS.outbound,
  return: DAVID_LEGS.return,
};

/** L'écran ne garde rien lui-même : on rejoue ici ce que fait le stockage. */
function Harness(handlers: {
  onContact: jest.Mock;
  onCallPassenger: jest.Mock;
  onMessagePassenger: jest.Mock;
  onCancel: jest.Mock;
  onEdit: jest.Mock;
  onBack: jest.Mock;
}) {
  const [legs, setLegs] = useState(INITIAL);
  const change = (direction: TripDirection, bookings: Booking[]) =>
    setLegs((current) => {
      const leg = current[direction];
      return leg ? { ...current, [direction]: { ...leg, bookings } } : current;
    });
  return (
    <DriverDashboard
      contextLabel="Mariage de Léa et Samuel · 14 juin"
      driver={{ firstName: 'David', zone: 'Ashdod' }}
      legs={legs}
      requests={DAVID_REQUESTS}
      passengers={DAVID_PASSENGERS}
      onBookingsChange={change}
      {...handlers}
    />
  );
}

async function renderDashboard() {
  const handlers = {
    onEdit: jest.fn(),
    onContact: jest.fn(),
    onCallPassenger: jest.fn(),
    onMessagePassenger: jest.fn(),
    onCancel: jest.fn(),
    onBack: jest.fn(),
  };
  await render(<Harness {...handlers} />);
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
    expect(screen.getByRole('tab', { name: 'Retour · 00h30–01h00' })).toBeOnTheScreen();
    expect(screen.getByText('Départ d’Ashdod')).toBeOnTheScreen();
    expect(screen.getByText('1 place libre')).toBeOnTheScreen();
    expect(screen.getByText('Esther')).toBeOnTheScreen();
    expect(screen.getByText('Esther +1')).toBeOnTheScreen();
    expect(screen.getByText('Libre')).toBeOnTheScreen();
  });

  it('montre les passagers de la voiture, à appeler ou à qui écrire', async () => {
    const { onCallPassenger, onMessagePassenger } = await renderDashboard();

    expect(screen.getByText('Dans ta voiture')).toBeOnTheScreen();
    expect(screen.getByText('Esther Azria')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Appeler Esther' }));
    expect(onCallPassenger).toHaveBeenCalledWith(
      expect.objectContaining({ passenger: expect.objectContaining({ firstName: 'Esther' }) })
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Écrire à Esther sur WhatsApp' }));
    expect(onMessagePassenger).toHaveBeenCalledTimes(1);
  });

  it('note une place prise puis la libère', async () => {
    await renderDashboard();

    await fireEvent.press(screen.getByRole('button', { name: 'Une place prise' }));
    expect(screen.getByText('Complet')).toBeOnTheScreen();
    expect(screen.getByText('Prise')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Une place prise' })).toBeDisabled();

    // D'abord la place notée à la main…
    await fireEvent.press(screen.getByRole('button', { name: 'Libérer une place' }));
    expect(screen.queryByText('Prise')).toBeNull();
    expect(screen.getByText('1 place libre')).toBeOnTheScreen();
    // … puis la réservation du dernier passager, avec tout son groupe (comme le serveur).
    await fireEvent.press(screen.getByRole('button', { name: 'Libérer une place' }));
    expect(screen.getByText('3 places libres')).toBeOnTheScreen();
  });

  it('liste les passagers proches du sens choisi et permet de les contacter', async () => {
    const { onContact } = await renderDashboard();

    expect(screen.getByText('Ils cherchent depuis Ashdod')).toBeOnTheScreen();
    expect(screen.getByText('Nathan Bensoussan')).toBeOnTheScreen();
    expect(screen.getByText('1 personne · Rova HaKirya')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Retour · 00h30–01h00' }));
    expect(screen.getByText('Retour vers Ashdod')).toBeOnTheScreen();
    // Au retour, Nathan n'est plus parmi ceux qui cherchent : il est dans la voiture.
    expect(screen.getByRole('button', { name: 'Appeler Nathan' })).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'Contacter' })).toHaveLength(1);

    await fireEvent.press(screen.getByRole('button', { name: 'Contacter' }));
    expect(onContact).toHaveBeenCalledWith(expect.objectContaining({ id: 's-rachel-ret' }));
  });

  it('demande confirmation avant de retirer la voiture', async () => {
    const { onCancel } = await renderDashboard();

    await fireEvent.press(screen.getByRole('button', { name: 'Je ne peux plus conduire' }));
    expect(onCancel).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Garder mon trajet' }));
    expect(onCancel).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Je ne peux plus conduire' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Retirer ma voiture' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
