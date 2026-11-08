import i18n from '@/lib/i18n';

import en from '../locales/en.json';
import fr from '../locales/fr.json';
import he from '../locales/he.json';

type Tree = { [key: string]: string | Tree };

function keysOf(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path] : keysOf(value, path);
  });
}

function valuesOf(tree: Tree): string[] {
  return Object.values(tree).flatMap((value) =>
    typeof value === 'string' ? [value] : valuesOf(value)
  );
}

// Les formes de pluriel varient selon la langue (l'hébreu a « _two ») : on compare les clés de base.
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

function baseKeysOf(tree: Tree): string[] {
  return [...new Set(keysOf(tree).map((key) => key.replace(PLURAL_SUFFIX, '')))].sort();
}

describe('traductions', () => {
  const reference = baseKeysOf(fr);

  it.each([
    ['he', he],
    ['en', en],
  ])('%s a exactement les mêmes clés que fr', (_name, locale) => {
    expect(baseKeysOf(locale)).toEqual(reference);
  });

  it.each([
    ['fr', fr],
    ['he', he],
    ['en', en],
  ])('%s fournit la forme « _other » de chaque pluriel', (_name, locale) => {
    const keys = keysOf(locale);
    const plurals = keys.filter((key) => PLURAL_SUFFIX.test(key));
    plurals.forEach((key) => {
      expect(keys).toContain(key.replace(PLURAL_SUFFIX, '_other'));
    });
  });

  it.each([
    ['fr', fr],
    ['he', he],
    ['en', en],
  ])('%s ne contient aucun texte vide', (_name, locale) => {
    expect(valuesOf(locale).every((value) => value.trim().length > 0)).toBe(true);
  });
});

describe('pluriels hébreux', () => {
  // Selon le moteur JavaScript, l'hébreu demande « two » ou « many » : sans ces formes, i18next
  // afficherait le texte français.
  it('a toutes ses formes, pour chaque pluriel', () => {
    const keys = keysOf(he);
    keys
      .filter((key) => key.endsWith('_other'))
      .forEach((key) => {
        const base = key.replace(/_other$/, '');
        expect(keys).toEqual(
          expect.arrayContaining([`${base}_one`, `${base}_two`, `${base}_many`])
        );
      });
  });
});

describe('pluriel du zéro en français', () => {
  it('reste au singulier, quel que soit le moteur JavaScript', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('dashboard.zone.seats', { count: 0 })).toBe('0 place');
    expect(i18n.t('dashboard.zone.seats', { count: 2 })).toBe('2 places');
  });
});
