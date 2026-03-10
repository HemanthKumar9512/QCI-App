// Mayan Calendar Multi-cycle Temporal Pattern Detection
const CYCLES = {
  tzolkin: 260,
  haab: 365,
  short: 13,
  venus: 584,
} as const;

type CycleType = keyof typeof CYCLES;

export interface MayanResult {
  dominantCycle: string;
  cycleStrength: number;
  nextVulnerableDate: string;
  cycleType: CycleType;
}

function autocorrelation(data: number[], lag: number): number {
  const n = data.length;
  if (lag >= n) return 0;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = data.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  if (variance === 0) return 0;
  let sum = 0;
  for (let t = 0; t < n - lag; t++) {
    sum += (data[t] - mean) * (data[t + lag] - mean);
  }
  return sum / ((n - lag) * variance);
}

export function detectMayanCycles(activityHistory: number[]): MayanResult {
  let bestCycle: CycleType = 'short';
  let bestStrength = 0;

  for (const [name, period] of Object.entries(CYCLES)) {
    // Use modular lag within data length
    const lag = Math.min(period, Math.floor(activityHistory.length / 2));
    if (lag < 2) continue;
    const ac = autocorrelation(activityHistory, lag);
    if (ac > bestStrength) {
      bestStrength = ac;
      bestCycle = name as CycleType;
    }
  }

  // Calculate next vulnerable date
  const cycleDays = CYCLES[bestCycle];
  const today = new Date();
  const nextDate = new Date(today.getTime() + cycleDays * 24 * 60 * 60 * 1000);

  return {
    dominantCycle: bestCycle.charAt(0).toUpperCase() + bestCycle.slice(1),
    cycleStrength: Math.max(0, Math.min(1, bestStrength)),
    nextVulnerableDate: nextDate.toISOString().split('T')[0],
    cycleType: bestCycle,
  };
}
