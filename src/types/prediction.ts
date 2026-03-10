export interface QuantumCircuitResult {
  churnProbability: number;
  quantumConfidence: number;
  statevector: { real: number; imag: number }[];
  circuitDepth: number;
  gateSequence: string[];
  parameters: number[];
}

export interface FederatedNode {
  nodeId: string;
  region: string;
  dataSize: number;
  currentLoss: number;
  lastSyncAt: string;
  weights: number[];
  status: 'synced' | 'training' | 'offline';
}

export interface FederatedRound {
  round: number;
  globalLoss: number;
  participatingNodes: number;
  convergenceDelta: number;
  timestamp: string;
}

export interface RLState {
  churnScore: number;
  customerLifetimeValue: number;
  sentimentScore: number;
  daysSinceLastActivity: number;
  supportTicketCount: number;
  npsScore: number;
  priceSensitivity: number;
  usageFrequency: number;
  contractDaysRemaining: number;
  fibonacciCluster: number;
}

export interface RLActionResult {
  action: number;
  actionName: string;
  probability: number;
  expectedReward: number;
  customerId: string;
}

export interface PipelineLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  module: string;
  message: string;
}

export interface PipelineMetrics {
  totalCustomers: number;
  criticalRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  avgChurnScore: number;
  totalCLVAtRisk: number;
  quantumAccuracy: number;
  zkProofsToday: number;
  totalEvents: number;
  pipelineRunning: boolean;
}
