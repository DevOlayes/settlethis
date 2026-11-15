export type MonetagBalanceField = "ct_balance" | "sethis_balance";

/** Build the idempotent wallet credit used by Monetag's valued-event batch. */
export function monetagWalletCreditSql(field: MonetagBalanceField): string {
  if (field !== "ct_balance" && field !== "sethis_balance") {
    throw new Error("Unsupported wallet balance field.");
  }
  return `UPDATE wallets
    SET ${field}=${field}+?,updated_at=CURRENT_TIMESTAMP
    WHERE user_id=?
      AND EXISTS(
        SELECT 1 FROM wallet_ledger
        WHERE idempotency_key=? AND user_id=? AND token=? AND amount=?
      )
      AND NOT EXISTS(
        SELECT 1 FROM ad_reward_events WHERE provider_event_id=?
      )`;
}
