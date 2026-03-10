// Vedic Math Preprocessing — Anurupyena sutra normalization
const PHI = 1.618033988749895; // Golden Ratio

export function vedicNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  const sigma = Math.sqrt(variance) || 1;
  const base = Math.pow(10, Math.ceil(Math.log10(Math.abs(mean) + 1)));

  return values.map(x => {
    // Nikhilam sutra: outlier compression
    if (Math.abs(x - mean) > 3 * sigma) {
      x = base - Math.abs(base - x);
    }
    // Anurupyena sutra: proportional normalization
    return ((x - min) * PHI) / range;
  });
}

export function buildFeatureVector(customer: {
  mrr: number; npsScore: number; supportTickets: number;
  daysSinceActivity: number; priceSensitivity: number;
  usageFrequency: number; churnScore: number; sentimentScore: number;
  clv: number; fibonacciCluster: number;
}): number[] {
  const raw = [
    customer.mrr, customer.npsScore, customer.supportTickets,
    customer.daysSinceActivity, customer.priceSensitivity,
    customer.usageFrequency, customer.churnScore, customer.sentimentScore,
    customer.clv, customer.fibonacciCluster,
  ];
  return vedicNormalize(raw);
}
