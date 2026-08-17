const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// Formats an ISO date (YYYY-MM-DD, from <input type="date">) as "23 Aug 2026".
// Dates that predate the ISO switch aren't ISO-formatted — return them unchanged
// rather than mangling them.
export function formatDisplayDate(value: string): string {
  if (!ISO_DATE.test(value)) return value
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}
