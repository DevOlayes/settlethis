interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: { prepare(query: string): D1Statement };
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, service: "settlethis", database: "connected" });
    }
    if (url.pathname === "/api/pool-court" && request.method === "GET") {
      try {
        const pool = await env.DB.prepare(
          "SELECT id, title, prize_amount, minimum_stake_ct, duration_days, status, opens_at, closes_at FROM pool_courts WHERE id = ?"
        ).bind("pool-court-001").first();
        if (!pool) return json({ error: "Pool Court has not been configured." }, 404);
        const totals = await env.DB.prepare(
          "SELECT side, COALESCE(SUM(stake_ct), 0) AS total_stake_ct, COUNT(*) AS participant_count FROM pool_positions WHERE pool_id = ? AND status = 'active' GROUP BY side"
        ).bind("pool-court-001").all();
        return json({ pool, sides: totals.results });
      } catch {
        return json({ error: "Pool Court data is temporarily unavailable." }, 503);
      }
    }
    if (url.pathname.startsWith("/api/") && request.method !== "GET") {
      return json({ error: "A verified account session and wallet authorization are required before any token transaction can be accepted." }, 401);
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
    return env.ASSETS.fetch(request);
  },
};
