export type MonetagPlacement = "home_ct" | "tasks_sethis" | "runner_lobby_gt" | "runner_run_sethis";
export type MonetagPostback = {
  eventId: string;
  userId: string;
  zoneId: string;
  placement: MonetagPlacement;
  token: "CT" | "SETHIS";
  amount: 2 | 100 | 150;
  balanceField: "ct_balance" | "sethis_balance";
  idempotencyKey: string;
};
export type MonetagPostbackParse =
  | { ok: true; value: MonetagPostback }
  | { ok: false; reason: string };

function field(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseMonetagPostback(body: Record<string, unknown>, expectedZoneId: string): MonetagPostbackParse {
  const eventId = field(body.ymid, 180);
  const eventType = field(body.reward_event_type, 40);
  const userId = field(body.telegram_id, 32);
  const zoneId = field(body.zone_id, 80);
  const requestVar = field(body.request_var, 40);
  if (!eventId || !/^[A-Za-z0-9._-]{1,180}$/.test(eventId) || !/^[0-9]{5,24}$/.test(userId) || eventType !== "valued") {
    return { ok: false, reason: "Only valued events with a valid unique event ID are eligible." };
  }
  if (!expectedZoneId || zoneId !== expectedZoneId) {
    return { ok: false, reason: "Unrecognised main ad zone." };
  }
  if (requestVar === "home_ct") {
    return { ok: true, value: { eventId,userId,zoneId,placement:"home_ct",token:"CT",amount:100,balanceField:"ct_balance",idempotencyKey:"monetag:"+eventId } };
  }
  if (requestVar === "tasks_sethis") {
    return { ok: true, value: { eventId,userId,zoneId,placement:"tasks_sethis",token:"SETHIS",amount:150,balanceField:"sethis_balance",idempotencyKey:"monetag:"+eventId } };
  }
  if (requestVar === "runner_lobby_gt") {
    return { ok: true, value: { eventId,userId,zoneId,placement:"runner_lobby_gt",token:"CT",amount:100,balanceField:"ct_balance",idempotencyKey:"monetag:"+eventId } };
  }
  if (requestVar === "runner_run_sethis") {
    return { ok: true, value: { eventId,userId,zoneId,placement:"runner_run_sethis",token:"SETHIS",amount:2,balanceField:"sethis_balance",idempotencyKey:"monetag:"+eventId } };
  }
  return { ok: false, reason: "Unrecognised reward placement." };
}

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
