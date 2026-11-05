import {
  formatDay,
  formatSchedule,
  formatShortTime,
  formatTime,
  formatTimeWindow,
} from '../format';

const start = new Date(2025, 5, 14, 19, 30);
const end = new Date(2025, 5, 15, 1, 0);

describe('formatage des dates', () => {
  it('écrit l’horaire comme la maquette en français', () => {
    expect(formatSchedule(start, end, 'fr')).toBe('Samedi 14 juin · 19h30 – 01h00');
  });

  it('utilise le format local en anglais', () => {
    expect(formatDay(start, 'en')).toBe('Saturday, June 14');
    expect(formatTime(start, 'en')).toMatch(/^7:30\sPM$/);
  });

  it('raccourcit les heures pile dans les créneaux', () => {
    const from = new Date(2025, 5, 14, 18, 0);
    expect(formatTimeWindow(from, start, 'fr')).toBe('18h–19h30');
    expect(formatShortTime(end, 'fr')).toBe('01h');
    expect(formatShortTime(from, 'en')).toMatch(/^6\sPM$/);
    expect(formatShortTime(from, 'he')).toBe('18:00');
  });

  it('utilise le format 24 h et le jour en hébreu', () => {
    expect(formatTime(start, 'he')).toBe('19:30');
    expect(formatTime(end, 'he')).toBe('1:00');
    expect(formatDay(start, 'he')).toContain('14');
  });
});
