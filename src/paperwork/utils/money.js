export function toMoney(n) {
  const x = Number(n || 0);
  return x.toFixed(2);
}

export function moneyGBP(n) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(x);
}

export function lineTotal(qty, unit) {
  return Number(qty || 0) * Number(unit || 0);
}

export function calcTotals(items, vatRatePercent = 0) {
  const subtotal = items.reduce((sum, it) => sum + lineTotal(it.qty, it.unitPrice), 0);
  const vatRate = Number(vatRatePercent || 0) / 100;
  const vat = subtotal * vatRate;
  const total = subtotal + vat;
  return { subtotal, vat, total };
}