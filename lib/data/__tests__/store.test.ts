import AsyncStorage from '@react-native-async-storage/async-storage';

import { flushAppData, getAppData, loadAppData, updateAppData } from '../store';

const NOW = new Date(2025, 5, 2, 10, 0);

describe('stockage local', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('installe la démo au premier lancement', async () => {
    await loadAppData(NOW);
    expect(getAppData().events.map((e) => e.id)).toContain('demo');
    expect(await AsyncStorage.getItem('rido.data')).not.toBeNull();
  });

  it('garde les changements, dates comprises, d’un lancement à l’autre', async () => {
    await loadAppData(NOW);
    updateAppData((data) => ({ ...data, events: data.events.filter((e) => e.id === 'demo') }));
    await flushAppData();

    await loadAppData(NOW);
    expect(getAppData().events).toHaveLength(1);
    expect(getAppData().events[0].startsAt).toEqual(new Date(2025, 5, 14, 19, 30));
  });

  it('repart de la démo si les données enregistrées sont illisibles', async () => {
    await AsyncStorage.setItem('rido.data', '{"version":42}');
    await loadAppData(NOW);
    expect(getAppData().events.length).toBeGreaterThan(1);
  });
});
