// Tests sur le vrai Supabase (npm run test:live) : environnement Node avec la vraie connexion à
// Internet. La configuration principale (jest-expo) simule le réseau et ignore ces fichiers.
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

// Adresse et clé publique du projet (.env.local), transmises aux tests.
const envFile = join(__dirname, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const match = /^\s*EXPO_PUBLIC_SUPABASE_(URL|ANON_KEY)\s*=\s*(.*?)\s*$/.exec(line);
    if (match) process.env[`RIDO_LIVE_${match[1]}`] ??= match[2];
  }
}

module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/lib/**/*.live.test.ts'],
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Module natif : remplacé par la langue et la région d'un téléphone de test.
    '^expo-localization$': '<rootDir>/lib/backend/test-stubs/expo-localization.js',
  },
};
