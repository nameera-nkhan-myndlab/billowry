export function formatMoney(value: number | string | null | undefined, currency = 'USD'): string {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(isNaN(n) ? 0 : n);
  } catch {
    return `${currency} ${(isNaN(n) ? 0 : n).toFixed(2)}`;
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}