import { addMinutes, keepWindowOrdered, timeSlots } from '../time-slots';

const at = (day: number, hours: number, minutes = 0) => new Date(2025, 5, day, hours, minutes);

describe('créneaux horaires', () => {
  it('découpe par quart d’heure, en passant minuit', () => {
    expect(timeSlots(at(14, 23, 30), at(15, 0, 15))).toEqual([
      at(14, 23, 30),
      at(14, 23, 45),
      at(15, 0, 0),
      at(15, 0, 15),
    ]);
  });

  it('s’aligne sur le quart d’heure suivant', () => {
    expect(timeSlots(at(14, 18, 5), at(14, 18, 30))).toEqual([at(14, 18, 15), at(14, 18, 30)]);
  });

  it('repousse la fin si elle passe avant le début', () => {
    expect(keepWindowOrdered({ from: at(14, 19), to: at(14, 18, 30) })).toEqual({
      from: at(14, 19),
      to: addMinutes(at(14, 19), 30),
    });
    const ordered = { from: at(14, 18), to: at(14, 18, 30) };
    expect(keepWindowOrdered(ordered)).toBe(ordered);
  });
});
