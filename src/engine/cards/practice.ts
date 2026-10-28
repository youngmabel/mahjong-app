/**
 * The invented practice card (docs/07-app-spec.md section 13). These are NOT NMJL hands; they imitate
 * the general style of a card so lessons can teach card reading and the engine can be tested before
 * the real 2026 card is entered. Section names follow the 2026 card's sections.
 *
 * Notation guide: docs/CARD-NOTATION.md.
 */

export const PRACTICE_CARD_TEXT = `
card: practice
name: Practice Card (invented hands)
year: 2026
source: invented

2026              | 30 | X | FF 2026g 2222r 6666b         | id: P-YEAR-1  | note: The year in one suit (Soap is the zero); a kong of 2s and a kong of 6s in the other two suits.
2468              | 25 | X | FF 22g 444g 666g 8888g       | id: P-EVEN-1  | note: Any one suit.
2468              | 35 | C | FF 2222g 4444g 6666g         | id: P-CONC-1  | note: Any one suit. Concealed.
Any Like Numbers  | 25 | X | FFFF 111g 111r 1111b         | id: P-LIKE-1  | opt: slide | note: Any like numbers, one group in each suit.
Quints            | 40 | X | 11111g 2222g FFFFF           | id: P-QUINT-1 | opt: slide | note: Any two consecutive numbers in one suit, the quint on the lower number.
Consecutive Run   | 25 | X | 11g 222g 3333g 444g 55g      | id: P-RUN-1   | opt: slide | note: Any five consecutive numbers in one suit.
Consecutive Run   | 30 | X | 111g 2222g 333g DDDDg        | id: P-RUN-2   | opt: slide dragon=matching | note: Any three consecutive numbers in one suit, with a kong of the matching dragon.
13579             | 25 | X | 11g 333g 5555g 777g 99g      | id: P-ODD-1   | note: Any one suit.
Winds-Dragons     | 25 | X | NNNN EEE WWW SSSS            | id: P-WIND-1  | note: These winds only.
Winds-Dragons     | 30 | X | NEWS DDDDr DDDDg FF          | id: P-WIND-2  | opt: dragon=literal | note: NEWS as four single tiles, a kong of Red Dragons and a kong of Green Dragons.
369               | 25 | X | 333g 666g 9999g 3333r        | id: P-369-1   | note: 3s, 6s and 9s in one suit; a kong of 3s in a second suit.
Singles and Pairs | 50 | C | FF 11g 22g 33g 44g 55g DDg   | id: P-SP-1    | opt: dragon=matching | note: Any one suit with its matching dragon. Concealed; no jokers.
`;

/** Expected number of concrete hands per line (worked out by hand; checked by the tests). */
export const PRACTICE_EXPECTED_TARGETS: Record<string, number> = {
  'P-YEAR-1': 6,
  'P-EVEN-1': 3,
  'P-CONC-1': 3,
  'P-LIKE-1': 27,
  'P-QUINT-1': 24,
  'P-RUN-1': 15,
  'P-RUN-2': 21,
  'P-ODD-1': 3,
  'P-WIND-1': 1,
  'P-WIND-2': 1,
  'P-369-1': 6,
  'P-SP-1': 3,
};
