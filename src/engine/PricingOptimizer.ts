// Simulated Annealing Pricing Optimizer
import type { PricingResult, Bundle } from '@/types/customer';

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

const ADD_ONS = [
  { name: 'Priority Support', price: 29, retentionImpact: 0.15 },
  { name: 'Advanced Analytics', price: 49, retentionImpact: 0.12 },
  { name: 'API Access', price: 39, retentionImpact: 0.10 },
  { name: 'Custom Integrations', price: 59, retentionImpact: 0.18 },
  { name: 'Dedicated IP', price: 19, retentionImpact: 0.05 },
  { name: 'White Label', price: 99, retentionImpact: 0.20 },
  { name: 'SSO/SAML', price: 29, retentionImpact: 0.08 },
  { name: 'Audit Logs', price: 19, retentionImpact: 0.06 },
  { name: 'Data Export', price: 15, retentionImpact: 0.04 },
  { name: 'Sandbox Environment', price: 35, retentionImpact: 0.09 },
  { name: 'Custom Reports', price: 45, retentionImpact: 0.11 },
  { name: 'SLA Guarantee', price: 79, retentionImpact: 0.16 },
  { name: 'Training Sessions', price: 25, retentionImpact: 0.07 },
  { name: 'Beta Access', price: 0, retentionImpact: 0.13 },
  { name: 'Community Forum', price: 0, retentionImpact: 0.03 },
  { name: 'Mobile App', price: 15, retentionImpact: 0.08 },
  { name: 'Webhooks', price: 10, retentionImpact: 0.05 },
  { name: 'Multi-user', price: 20, retentionImpact: 0.10 },
  { name: 'Backup & Restore', price: 25, retentionImpact: 0.07 },
  { name: 'Compliance Pack', price: 69, retentionImpact: 0.14 },
];

export function optimizePrice(
  basePrice: number,
  priceSensitivity: number,
  churnScore: number
): PricingResult {
  const energyHistory: number[] = [];

  function energy(price: number): number {
    const churnRisk = sigmoid(priceSensitivity * 3 * (price - basePrice) / basePrice);
    const retention = 1 - churnRisk;
    const revenue = price * retention;
    return churnRisk * 100 - revenue;
  }

  let currentPrice = basePrice;
  let currentEnergy = energy(currentPrice);
  let bestPrice = currentPrice;
  let bestEnergy = currentEnergy;
  let T = 1000;
  let iterations = 0;

  while (T > 0.01 && iterations < 2000) {
    const candidate = currentPrice + (Math.random() - 0.5) * 20;
    if (candidate < basePrice * 0.5 || candidate > basePrice * 1.5) {
      T *= 0.995;
      iterations++;
      continue;
    }
    const candidateEnergy = energy(candidate);
    const dE = candidateEnergy - currentEnergy;

    if (dE < 0 || Math.random() < Math.exp(-dE / T)) {
      currentPrice = candidate;
      currentEnergy = candidateEnergy;
      if (currentEnergy < bestEnergy) {
        bestEnergy = currentEnergy;
        bestPrice = currentPrice;
      }
    }
    if (iterations % 10 === 0) energyHistory.push(currentEnergy);
    T *= 0.995;
    iterations++;
  }

  const retentionAtOptimal = 1 - sigmoid(priceSensitivity * 3 * (bestPrice - basePrice) / basePrice);
  const revenueImpact = (bestPrice * retentionAtOptimal) - (basePrice * (1 - churnScore));

  // Elasticity curve
  const elasticityCurve = Array.from({ length: 21 }, (_, i) => {
    const pctChange = (i - 10) * 3; // -30% to +30%
    const newPrice = basePrice * (1 + pctChange / 100);
    const churnRate = sigmoid(priceSensitivity * 3 * (newPrice - basePrice) / basePrice);
    return { priceChange: pctChange, churnRate: Math.round(churnRate * 100) / 100 };
  });

  // Bundle recommendations (greedy knapsack)
  const budget = basePrice * 0.3;
  const sorted = [...ADD_ONS].sort((a, b) => (b.retentionImpact / (b.price || 0.01)) - (a.retentionImpact / (a.price || 0.01)));
  const bundles: Bundle[] = [];
  for (let b = 0; b < 3; b++) {
    let spent = 0;
    const features: string[] = [];
    let totalImpact = 0;
    let totalPrice = 0;
    const startIdx = b * 3;
    for (let i = startIdx; i < sorted.length && features.length < 4; i++) {
      if (spent + sorted[i].price <= budget + b * 20) {
        features.push(sorted[i].name);
        spent += sorted[i].price;
        totalImpact += sorted[i].retentionImpact;
        totalPrice += sorted[i].price;
      }
    }
    bundles.push({
      name: ['Essential', 'Growth', 'Premium'][b],
      features,
      price: totalPrice,
      retentionImpact: Math.min(0.95, totalImpact),
    });
  }

  return {
    optimalPrice: Math.round(bestPrice * 100) / 100,
    basePrice,
    expectedRetention: Math.round(retentionAtOptimal * 1000) / 10,
    revenueImpact: Math.round(revenueImpact * 100) / 100,
    iterationsRun: iterations,
    convergenceTemp: T,
    energyHistory,
    elasticityCurve,
    bundles,
  };
}
