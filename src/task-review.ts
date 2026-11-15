export type TaskRewardToken = "CT" | "SETHIS";
export type TaskApprovalInput = {
  claimId: string;
  userId: string;
  token: TaskRewardToken;
  amount: number;
  taskKey: string;
  taskTitle: string;
  adminId: string;
  note: string;
  ledgerId: string;
  notificationId: string;
};

export function taskApprovalStatements(input: TaskApprovalInput): Array<{sql:string;params:unknown[]}> {
  if (input.token !== "CT" && input.token !== "SETHIS") {
    throw new Error("Unsupported task reward token.");
  }
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new Error("Task reward amount must be a positive safe integer.");
  }
  const field = input.token === "CT" ? "ct_balance" : "sethis_balance";
  const key = "task-reward:" + input.userId + ":" + input.taskKey;
  return [
    {
      sql: "INSERT OR IGNORE INTO wallets(user_id,ct_balance,sethis_balance) VALUES(?,0,0)",
      params: [input.userId]
    },
    {
      sql: "UPDATE wallets SET " + field + "=" + field + "+?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND EXISTS(SELECT 1 FROM task_claims WHERE id=? AND status='pending') AND NOT EXISTS(SELECT 1 FROM wallet_ledger WHERE idempotency_key=?)",
      params: [input.amount,input.userId,input.claimId,key]
    },
    {
      sql: "INSERT OR IGNORE INTO wallet_ledger(id,user_id,token,amount,transaction_type,reference_id,idempotency_key,grant_source,grant_reason,admin_id) SELECT ?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM task_claims WHERE id=? AND status='pending') AND NOT EXISTS(SELECT 1 FROM wallet_ledger WHERE idempotency_key=?)",
      params: [input.ledgerId,input.userId,input.token,input.amount,"task_reward",input.claimId,key,"task_reward",input.taskTitle,input.adminId,input.claimId,key]
    },
    {
      sql: "UPDATE task_claims SET status='approved',reviewed_by=?,review_note=?,reward_ledger_key=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'",
      params: [input.adminId,input.note,key,input.claimId]
    },
    {
      sql: "INSERT OR IGNORE INTO notifications(id,user_id,type,title,body,reference_id,event_key) SELECT ?,?,'task_reward','Task reward approved',?,?,? WHERE EXISTS(SELECT 1 FROM task_claims WHERE id=? AND status='approved' AND reward_ledger_key=?)",
      params: [input.notificationId,input.userId,input.taskTitle+" reward: "+input.amount+" "+input.token+".",input.claimId,"task-approved:"+input.claimId,input.claimId,key]
    }
  ];
}
