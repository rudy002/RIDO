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

describe('traductions', () => {
  const reference = keysOf(fr).sort();

  it.each([
    ['he', he],
    ['en', en],
  ])('%s a exactement les mêmes clés que fr', (_name, locale) => {
    expect(keysOf(locale).sort()).toEqual(reference);
  });

  it.each([
    ['fr', fr],
    ['he', he],
    ['en', en],
  ])('%s ne contient aucun texte vide', (_name, locale) => {
    expect(valuesOf(locale).every((value) => value.trim().length > 0)).toBe(true);
  });
});
