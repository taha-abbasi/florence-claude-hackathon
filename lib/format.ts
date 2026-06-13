// Currency + savings helpers. The only "math" beyond pricing.ts.

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatCurrencyWhole(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function savingsPct(real: number, sticker: number): number {
  if (!sticker || sticker <= 0) return 0;
  return Math.round((1 - real / sticker) * 100);
}
