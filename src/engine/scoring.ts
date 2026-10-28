/**
 * Payments (docs/01-rules.md section 13). Only the winner is paid.
 * - Win on a discard: the discarder pays double the hand's value; the other two pay single.
 * - Self-picked win: all three pay double.
 * - Jokerless bonus (not for Singles and Pairs or Quints): every payment doubles again.
 * Dead players still pay the winner [M-H].
 */

export function mahjongPayments(winner: number, value: number, jokerlessBonus: boolean, selfPick: boolean, from: number | null): number[] {
  const pay = [0, 0, 0, 0];
  const bonus = jokerlessBonus ? 2 : 1;
  for (let p = 0; p < 4; p++) {
    if (p === winner) continue;
    const amount = value * bonus * (selfPick || p === from ? 2 : 1);
    pay[p] = -amount;
    pay[winner] = (pay[winner] as number) + amount;
  }
  return pay;
}
