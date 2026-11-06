import i18n from '@/lib/i18n';

import { render, screen } from '@testing-library/react-native';

import { initialsOf } from '../Avatar';
import { SeatRow } from '../SeatRow';

describe('SeatRow', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it.each([
    [4, 3, '3 libres'],
    [4, 1, '1 libre'],
    [3, 0, 'Complet'],
  ])('%i places dont %i libres : « %s »', async (total, free, label) => {
    await render(<SeatRow total={total} free={free} />);
    expect(screen.getByText(label)).toBeOnTheScreen();
  });

  describe('en hébreu', () => {
    beforeAll(async () => {
      await i18n.changeLanguage('he');
    });
    // Après le démontage de chaque test : pas de mise à jour hors `act`.
    afterAll(async () => {
      await i18n.changeLanguage('fr');
    });

    it('accorde le pluriel', async () => {
      await render(<SeatRow total={4} free={2} />);
      expect(screen.getByText('2 פנויים')).toBeOnTheScreen();
    });
  });
});

describe('initialsOf', () => {
  it('garde la première lettre des deux premiers mots', () => {
    expect(initialsOf('David Cohen')).toBe('DC');
    expect(initialsOf('  marie  claire dupont ')).toBe('MC');
    expect(initialsOf('רות אזולאי')).toBe('רא');
  });
});
