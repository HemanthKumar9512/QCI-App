export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type Segment = 'Enterprise' | 'SMB' | 'Startup' | 'Individual';
export type Trajectory = 'improving' | 'declining' | 'stable' | 'volatile';

export interface Customer {
  id: string;
  name: string;
  email: string;
  segment: Segment;
  plan: string;
  mrr: number;
  createdAt: string;
  lastActivity: string;
  npsScore: number;
  supportTickets: number;
  contractEnd: string;
  churnScore: number;
  riskLevel: RiskLevel;
  clv: number;
  sentimentScore: number;
  sentimentTrajectory: Trajectory;
  emotion: string;
  quantumConfidence: number;
  fibonacciCluster: number;
  mayanCycle: { dominantCycle: string; nextVulnerableDate: string; cycleStrength: number };
  daysSinceActivity: number;
  priceSensitivity: number;
  usageFrequency: number;
  assignedStrategy: string;
  activityHistory: number[];
  sentimentHistory: number[];
  predictions: Prediction[];
  retentionActions: RetentionAction[];
}

export interface Prediction {
  id: string;
  customerId: string;
  score: number;
  riskLevel: RiskLevel;
  quantumConfidence: number;
  modelVersion: string;
  blockchainHash: string;
  createdAt: string;
}

export interface RetentionAction {
  id: string;
  customerId: string;
  actionType: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  executedAt?: string;
  outcome?: string;
  revenueImpact: number;
}

export interface SentimentRecord {
  id: string;
  customerId: string;
  source: string;
  rawText: string;
  compound: number;
  emotion: string;
  trajectory: Trajectory;
  languageDetected: string;
  processedAt: string;
}

export interface PricingResult {
  optimalPrice: number;
  basePrice: number;
  expectedRetention: number;
  revenueImpact: number;
  iterationsRun: number;
  convergenceTemp: number;
  energyHistory: number[];
  elasticityCurve: { priceChange: number; churnRate: number }[];
  bundles: Bundle[];
}

export interface Bundle {
  name: string;
  features: string[];
  price: number;
  retentionImpact: number;
}
