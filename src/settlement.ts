export type PoolStake = { id: string; user_id: string; stake_ct: number };
export type PoolPayout = PoolStake & { amount: number };

/** Allocate every SETHIS unit proportionally using integer arithmetic and deterministic largest remainders. */
export function allocatePoolPrize(prizeAmount: number, positions: PoolStake[]): { totalStake: number; payouts: PoolPayout[] } {
  if (!Number.isSafeInteger(prizeAmount) || prizeAmount <= 0) throw new Error("Prize must be a positive safe integer.");
  if (!Array.isArray(positions) || positions.length === 0) throw new Error("At least one winning position is required.");

  const seen = new Set<string>();
  let total = 0n;
  for (const position of positions) {
    if (!position.id || !position.user_id || !Number.isSafeInteger(position.stake_ct) || position.stake_ct <= 0) {
      throw new Error("Every winning position must have an identity and a positive safe-integer stake.");
    }
    if (seen.has(position.user_id)) throw new Error("A user may only have one position in a Pool Court.");
    seen.add(position.user_id);
    total += BigInt(position.stake_ct);
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Combined winning stake exceeds the safe integer range.");

  const prize = BigInt(prizeAmount);
  const payouts = positions.map(position => {
    const numerator = prize * BigInt(position.stake_ct);
    return { ...position, amount: Number(numerator / total), remainder: numerator % total };
  });
  const allocated = payouts.reduce((sum, payout) => sum + BigInt(payout.amount), 0n);
  const remaining = Number(prize - allocated);
  const priority = [...payouts].sort((a, b) => {
    if (a.remainder !== b.remainder) return a.remainder > b.remainder ? -1 : 1;
    if (a.stake_ct !== b.stake_ct) return b.stake_ct - a.stake_ct;
    return a.user_id.localeCompare(b.user_id);
  });
  for (let index = 0; index < remaining; index++) priority[index].amount++;

  return {
    totalStake: Number(total),
    payouts: payouts.map(({ remainder: _remainder, ...payout }) => payout)
  };
}
