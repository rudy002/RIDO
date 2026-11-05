import { palette } from '../tokens';
import { buildTheme } from '../use-theme';

describe('buildTheme', () => {
  it('utilise Nunito en français et en anglais', () => {
    expect(buildTheme('light', 'fr').typography.body.fontFamily).toBe('Nunito_600SemiBold');
    expect(buildTheme('light', 'en').components.buttonPrimary.text.fontFamily).toBe(
      'Nunito_900Black'
    );
  });

  it('remplace Nunito par Rubik en hébreu, à graisse égale', () => {
    const he = buildTheme('light', 'he');
    expect(he.typography.body.fontFamily).toBe('Rubik_600SemiBold');
    expect(he.typography.display.fontFamily).toBe('Rubik_900Black');
    expect(he.components.input.text.fontFamily).toBe('Rubik_700Bold');
    expect(he.components.tabBar.labelActive.fontFamily).toBe('Rubik_900Black');
  });

  it('active le RTL uniquement pour l’hébreu', () => {
    expect(buildTheme('light', 'he').isRTL).toBe(true);
    expect(buildTheme('light', 'fr').isRTL).toBe(false);
    expect(buildTheme('light', 'en').isRTL).toBe(false);
  });

  it('prend les couleurs du mode demandé', () => {
    expect(buildTheme('dark', 'fr').colors.background).toBe(palette.dark.background);
    expect(buildTheme('light', 'fr').colors.background).toBe(palette.light.background);
  });

  it('garde les cibles tactiles des boutons à 48 px minimum', () => {
    const { components, sizes } = buildTheme('light', 'fr');
    expect(components.buttonPrimary.container.height).toBeGreaterThanOrEqual(sizes.touchMin);
    expect(components.buttonInverse.container.height).toBeGreaterThanOrEqual(sizes.touchMin);
    expect(components.buttonOutline.container.height).toBeGreaterThanOrEqual(sizes.touchMin);
  });
});
