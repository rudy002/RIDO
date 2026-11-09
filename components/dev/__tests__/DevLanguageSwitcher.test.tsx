import i18n from '@/lib/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { loadLanguageOverride } from '@/lib/i18n/language-override';

import { DevLanguageSwitcher } from '../DevLanguageSwitcher';

describe('DevLanguageSwitcher', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
  });

  afterAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('change de langue', async () => {
    await render(<DevLanguageSwitcher />);

    await fireEvent.press(screen.getByRole('button', { name: 'Langue (développement)' }));
    await fireEvent.press(screen.getByRole('button', { name: 'EN' }));

    expect(i18n.language).toBe('en');
    expect(await loadLanguageOverride()).toBe('en');
  });

  it('passe en hébreu sans redémarrer', async () => {
    await render(<DevLanguageSwitcher />);

    await fireEvent.press(screen.getByRole('button', { name: 'Langue (développement)' }));
    await fireEvent.press(screen.getByRole('button', { name: 'HE' }));

    expect(await loadLanguageOverride()).toBe('he');
    expect(i18n.language).toBe('he');
  });

  it('revient à la langue du téléphone', async () => {
    await render(<DevLanguageSwitcher />);

    await fireEvent.press(screen.getByRole('button', { name: 'Langue (développement)' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Tél.' }));

    expect(await loadLanguageOverride()).toBeNull();
  });
});
