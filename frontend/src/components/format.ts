export function formatMoney(value: number | string | null | undefined, currency = 'USD'): string {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(safe);
  } catch {
    return `${currency} ${safe.toFixed(2)}`;
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}