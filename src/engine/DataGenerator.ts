// Realistic Customer Data Generator
import type { Customer, Prediction, RiskLevel, Segment } from '@/types/customer';
import { analyzeSentiment, computeTrajectory } from './SentimentAnalyzer';
import { detectMayanCycles } from './MayanCalendar';

const FIRST_NAMES = [
  'Priya', 'Aisha', 'Carlos', 'Yuki', 'Olumide', 'Fatima', 'Chen', 'Dmitri',
  'Amara', 'Rajesh', 'Sofia', 'Hiroshi', 'Nneka', 'Mohammed', 'Mei', 'Sven',
  'Deepa', 'Kofi', 'Isabella', 'Kenji', 'Ngozi', 'Ahmad', 'Ling', 'Boris',
  'Ananya', 'Emeka', 'Carmen', 'Takeshi', 'Zainab', 'Wei', 'Viktor', 'Kavya',
  'Chidi', 'Lucia', 'Ryo', 'Adaeze', 'Hassan', 'Xiaoming', 'Elena', 'Arjun',
  'Blessing', 'Marco', 'Sakura', 'Obinna', 'Layla', 'Jun', 'Natasha', 'Vikram',
  'Folake', 'Alejandro', 'Hana', 'Ifeanyi', 'Maryam', 'Tao', 'Svetlana', 'Ravi',
  'Amina', 'Diego', 'Yui', 'Chukwu', 'Noor', 'Feng', 'Anastasia', 'Suresh',
];
const LAST_NAMES = [
  'Sharma', 'Al-Hassan', 'Hernandez', 'Tanaka', 'Okafor', 'Abbas', 'Zhang', 'Petrov',
  'Diallo', 'Patel', 'Rodriguez', 'Yamamoto', 'Nwosu', 'Khan', 'Li', 'Johansson',
  'Gupta', 'Mensah', 'Garcia', 'Watanabe', 'Eze', 'Ibrahim', 'Wang', 'Ivanov',
  'Krishnan', 'Adeyemi', 'Martinez', 'Sato', 'Okoro', 'Ahmed', 'Liu', 'Popov',
];
const PLANS = ['Free', 'Starter', 'Pro', 'Business', 'Enterprise'];
const EMOTIONS = ['frustrated', 'confused', 'disappointed', 'excited', 'impatient',
  'trusting', 'angry', 'joyful', 'grateful', 'loyal', 'indifferent', 'overwhelmed'];
const STRATEGIES = ['No action', 'Email campaign', 'Retention call', 'Loyalty discount',
  'Service upgrade', 'Success manager', 'Beta program', 'Executive outreach', 'Win-back'];

function rand(min: number, max: number): number { return min + Math.random() * (max - min); }
function randInt(min: number, max: number): number { return Math.floor(rand(min, max + 1)); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function normalRandom(mean: number, std: number): number {
  const u1 = Math.random() || 1e-10;
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.75) return 'critical';
  if (score >= 0.5) return 'high';
  if (score >= 0.25) return 'medium';
  return 'low';
}

function generateActivityHistory(): number[] {
  const history: number[] = [];
  let base = rand(5, 50);
  for (let d = 0; d < 365; d++) {
    const dayOfWeek = d % 7;
    const weekendFactor = dayOfWeek >= 5 ? 0.4 : 1;
    const holidayFactor = (d % 90 < 3) ? 0.2 : 1;
    const trend = 1 - (d / 365) * rand(-0.3, 0.5);
    const noise = rand(0.7, 1.3);
    history.push(Math.max(0, Math.round(base * weekendFactor * holidayFactor * trend * noise)));
  }
  return history;
}

function generateSentimentHistory(): number[] {
  let val = rand(-0.3, 0.5);
  return Array.from({ length: 90 }, () => {
    val += rand(-0.15, 0.15);
    val = Math.max(-1, Math.min(1, val));
    return Math.round(val * 100) / 100;
  });
}

export function generateCustomers(count: number = 200): Customer[] {
  const customers: Customer[] = [];
  const segmentDist: [Segment, number][] = [
    ['Enterprise', 0.2], ['SMB', 0.35], ['Startup', 0.3], ['Individual', 0.15],
  ];
  const mrrRanges: Record<Segment, [number, number]> = {
    Enterprise: [2000, 50000], SMB: [200, 2000], Startup: [50, 500], Individual: [10, 100],
  };

  for (let i = 0; i < count; i++) {
    const r = Math.random();
    let cumProb = 0;
    let segment: Segment = 'SMB';
    for (const [seg, prob] of segmentDist) {
      cumProb += prob;
      if (r < cumProb) { segment = seg; break; }
    }

    const [mrrMin, mrrMax] = mrrRanges[segment];
    const mrr = Math.round(rand(mrrMin, mrrMax));
    const supportTickets = randInt(0, 24);
    const npsScore = Math.max(1, Math.min(10, Math.round(normalRandom(7, 2))));
    const daysSinceActivity = randInt(0, 90);
    const activityHistory = generateActivityHistory();
    const sentimentHistory = generateSentimentHistory();
    const sentimentScore = sentimentHistory[sentimentHistory.length - 1];
    const priceSensitivity = Math.round(rand(0.1, 0.9) * 100) / 100;
    const usageFrequency = Math.round(rand(0.5, 15) * 10) / 10;

    // Compute churn score from weighted factors
    const recencyFactor = daysSinceActivity / 90;
    const freqDecline = activityHistory.slice(-30).reduce((a, b) => a + b, 0) /
      (activityHistory.slice(-60, -30).reduce((a, b) => a + b, 0) || 1);
    const freqDeclineFactor = Math.max(0, Math.min(1, 1 - freqDecline));
    const sentimentFactor = (1 - sentimentScore) / 2;
    const supportFactor = supportTickets / 24;
    const npsFactor = (10 - npsScore) / 10;
    const churnScore = Math.max(0, Math.min(1,
      0.3 * recencyFactor + 0.25 * freqDeclineFactor + 0.2 * sentimentFactor +
      0.15 * supportFactor + 0.1 * npsFactor + rand(-0.05, 0.05)));

    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const mayanCycle = detectMayanCycles(activityHistory);
    const trajectory = computeTrajectory(sentimentHistory);

    const createdAt = new Date(Date.now() - randInt(30, 1000) * 86400000).toISOString();
    const contractEnd = new Date(Date.now() + randInt(30, 365) * 86400000).toISOString();

    customers.push({
      id: `cust-${i.toString().padStart(4, '0')}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${pick(['gmail.com', 'company.co', 'enterprise.io', 'startup.dev', 'business.com'])}`,
      segment,
      plan: segment === 'Enterprise' ? pick(['Business', 'Enterprise']) :
        segment === 'Individual' ? pick(['Free', 'Starter']) : pick(PLANS),
      mrr,
      createdAt,
      lastActivity: new Date(Date.now() - daysSinceActivity * 86400000).toISOString(),
      npsScore,
      supportTickets,
      contractEnd,
      churnScore: Math.round(churnScore * 1000) / 1000,
      riskLevel: getRiskLevel(churnScore),
      clv: Math.round(mrr * rand(12, 48)),
      sentimentScore,
      sentimentTrajectory: trajectory,
      emotion: pick(EMOTIONS),
      quantumConfidence: Math.round(rand(0.6, 0.98) * 100) / 100,
      fibonacciCluster: randInt(0, 8),
      mayanCycle,
      daysSinceActivity,
      priceSensitivity,
      usageFrequency,
      assignedStrategy: churnScore > 0.5 ? pick(STRATEGIES.slice(1)) : 'No action',
      activityHistory,
      sentimentHistory,
      predictions: Array.from({ length: randInt(3, 8) }, (_, j) => ({
        id: `pred-${i}-${j}`,
        customerId: `cust-${i.toString().padStart(4, '0')}`,
        score: Math.round(rand(churnScore - 0.15, churnScore + 0.15) * 1000) / 1000,
        riskLevel: getRiskLevel(churnScore + rand(-0.15, 0.15)),
        quantumConfidence: Math.round(rand(0.6, 0.98) * 100) / 100,
        modelVersion: `v${randInt(1, 3)}.${randInt(0, 9)}.${randInt(0, 9)}`,
        blockchainHash: `00${Math.random().toString(16).slice(2, 14)}${Math.random().toString(16).slice(2, 14)}`,
        createdAt: new Date(Date.now() - (j + 1) * randInt(1, 7) * 86400000).toISOString(),
      })),
      retentionActions: [],
    });
  }
  return customers;
}
