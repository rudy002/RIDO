import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { DevSettings } from 'react-native';

import { loadLanguageOverride } from '@/lib/i18n/language-override';

import { DevLanguageSwitcher } from '../DevLanguageSwitcher';

// Le vrai module dépend du serveur de développement.
jest.mock('react-native/Libraries/Utilities/DevSettings', () => ({
  __esModule: true,
  default: { reload: jest.fn(), addMenuItem: jest.fn() },
}));

describe('DevLanguageSwitcher', () => {
  const reload = jest.mocked(DevSettings.reload);

  beforeEach(async () => {
    reload.mockClear();
    await i18n.changeLanguage('fr');
  });

  afterAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('change de langue sans redémarrer quand le sens ne change pas', async () => {
    await render(<DevLanguageSwitcher />);

    await fireEvent.press(screen.getByRole('button', { name: 'Langue (développement)' }));
    await fireEvent.press(screen.getByRole('button', { name: 'EN' }));

    expect(i18n.language).toBe('en');
    expect(await loadLanguageOverride()).toBe('en');
    expect(reload).not.toHaveBeenCalled();
  });

  it('redémarre l’appli pour passer en hébreu (RTL)', async () => {
    await render(<DevLanguageSwitcher />);

    await fireEvent.press(screen.getByRole('button', { name: 'Langue (développement)' }));
    await fireEvent.press(screen.getByRole('button', { name: 'HE' }));

    expect(await loadLanguageOverride()).toBe('he');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('revient à la langue du téléphone', async () => {
    await render(<DevLanguageSwitcher />);

    await fireEvent.press(screen.getByRole('button', { name: 'Langue (développement)' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Tél.' }));

    expect(await loadLanguageOverride()).toBeNull();
  });
});
