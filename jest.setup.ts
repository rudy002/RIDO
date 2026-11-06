// Simulation officielle des zones sûres : dans l'appli, Expo Router fournit le SafeAreaProvider.
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

// Simulation officielle du contrôleur de clavier (module natif).
jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest')
);

// Simulation officielle du stockage local (module natif).
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
