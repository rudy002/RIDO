import { isSameDay, monthWeeks, moveToDay } from '../calendar';

describe('calendrier', () => {
  it('commence la semaine le lundi en français', () => {
    // 1er juin 2025 : un dimanche.
    const weeks = monthWeeks(new Date(2025, 5, 1), 1);
    expect(weeks[0].slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(weeks[0][6]).toEqual(new Date(2025, 5, 1));
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it('commence la semaine le dimanche en hébreu et en anglais', () => {
    const weeks = monthWeeks(new Date(2025, 5, 1), 0);
    expect(weeks[0][0]).toEqual(new Date(2025, 5, 1));
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
  });

  it('déplace un horaire sur un autre jour, lendemain compris', () => {
    const start = new Date(2025, 5, 14, 19, 30);
    const end = new Date(2025, 5, 15, 1, 0);
    const day = new Date(2025, 6, 4);
    expect(moveToDay(start, start, day)).toEqual(new Date(2025, 6, 4, 19, 30));
    expect(moveToDay(end, start, day)).toEqual(new Date(2025, 6, 5, 1, 0));
    expect(isSameDay(new Date(2025, 6, 4, 23), day)).toBe(true);
  });
});
