const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Jul 1, 2026". Date-only strings stay on their calendar day.
export function formatShortDate(iso: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = new Date(dateOnly ? `${iso}T00:00:00` : iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export const formatPopulation = (n: number) => n.toLocaleString("en-US");

export const monthAbbrev = (monthIndex: number) => MONTHS[monthIndex];
