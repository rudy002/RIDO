import i18n from '@/lib/i18n';

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import { WEDDING as DEMO_EVENT } from '@/lib/data/__fixtures__/demo';

import { EventShare } from '../EventShare';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));

const LINK = 'https://rido.app/e/lea-samuel';
// Espaces insécables avant « : » et « ? », comme dans le texte français.
const MESSAGE =
  'Mariage de Léa et Samuel\u00a0: on organise le covoiturage ici. Qui a de la place, qui cherche un trajet\u00a0? https://rido.app/e/lea-samuel';

async function renderShare() {
  const handlers = { onClose: jest.fn(), onShare: jest.fn(), onOpenDashboard: jest.fn() };
  await render(<EventShare event={DEMO_EVENT} link={LINK} {...handlers} />);
  return handlers;
}

describe('EventShare', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('résume l’événement et montre le message qui sera envoyé', async () => {
    await renderShare();

    expect(screen.getByRole('header', { name: 'Ton événement est prêt !' })).toBeOnTheScreen();
    expect(screen.getByText('Samedi 14 juin · 19h30 – 01h00')).toBeOnTheScreen();
    expect(screen.getByText('Domaine des Oliviers · Aller et retour')).toBeOnTheScreen();
    expect(screen.getByText('rido.app/e/lea-samuel')).toBeOnTheScreen();
    expect(screen.getByText(MESSAGE)).toBeOnTheScreen();
  });

  it('copie le lien complet et le confirme', async () => {
    jest.useFakeTimers();
    await renderShare();

    await fireEvent.press(screen.getByRole('button', { name: 'Copier' }));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(LINK);
    expect(screen.getByRole('button', { name: 'Copié' })).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Copier' })).toBeOnTheScreen();
    jest.useRealTimers();
  });

  it('envoie le message et ouvre les autres actions', async () => {
    const { onShare, onOpenDashboard, onClose } = await renderShare();

    await fireEvent.press(screen.getByRole('button', { name: 'Envoyer sur WhatsApp' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Voir mon tableau de bord' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fermer' }));

    expect(onShare).toHaveBeenCalledWith(MESSAGE);
    expect(onOpenDashboard).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
