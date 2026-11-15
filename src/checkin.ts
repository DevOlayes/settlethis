export function lagosDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: string) => parts.find(part => part.type === type)?.value || "00";
  return value("year") + "-" + value("month") + "-" + value("day");
}

export function checkinSummary(dates: string[], today: string) {
  const set = new Set(dates);
  let cursor = set.has(today)
    ? today
    : new Date(Date.parse(today + "T00:00:00Z") - 86400000).toISOString().slice(0, 10);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = new Date(Date.parse(cursor + "T00:00:00Z") - 86400000).toISOString().slice(0, 10);
  }
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.parse(today + "T00:00:00Z") + (index - 6) * 86400000)
      .toISOString().slice(0, 10);
    return { date, checked_in: set.has(date) };
  });
  return {
    today,
    days,
    streak,
    total_checkins: dates.length,
    checked_in_today: set.has(today)
  };
}
