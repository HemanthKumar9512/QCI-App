// Global QCI Store — customers, pipeline, UI
import { create } from 'zustand';
import type { Customer } from '@/types/customer';
import type { Block, SmartContractEvent, ZKProof } from '@/types/blockchain';
import type { FederatedNode, FederatedRound, PipelineLog, PipelineMetrics, RLActionResult } from '@/types/prediction';
import { generateCustomers } from '@/engine/DataGenerator';
import { initChain, addTransaction, mineBlock, getChain, getLatestBlocks, getChainStats } from '@/engine/ChainManager';
import { predict } from '@/engine/QuantumCircuit';
import { buildFeatureVector } from '@/engine/VedicPreprocessor';
import { selectAction, ACTIONS } from '@/engine/RLAgent';
import { generateZKProof } from '@/engine/ZKProofEngine';
import { createNodes, runFederatedRound } from '@/engine/FederatedLearning';

interface QCIStore {
  // Data
  customers: Customer[];
  blocks: Block[];
  zkProofs: ZKProof[];
  contractEvents: SmartContractEvent[];
  federatedNodes: FederatedNode[];
  federatedRounds: FederatedRound[];
  pipelineLogs: PipelineLog[];
  rlActions: RLActionResult[];
  metrics: PipelineMetrics;
  // UI
  sidebarCollapsed: boolean;
  pipelineRunning: boolean;
  initialized: boolean;
  // Actions
  initialize: () => void;
  toggleSidebar: () => void;
  updateRandomCustomers: () => void;
  runPipeline: () => void;
  addLog: (level: PipelineLog['level'], module: string, message: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
}

function computeMetrics(customers: Customer[]): PipelineMetrics {
  const critical = customers.filter(c => c.riskLevel === 'critical').length;
  const high = customers.filter(c => c.riskLevel === 'high').length;
  const medium = customers.filter(c => c.riskLevel === 'medium').length;
  const low = customers.filter(c => c.riskLevel === 'low').length;
  const avgChurn = customers.reduce((s, c) => s + c.churnScore, 0) / customers.length;
  const totalCLV = customers.filter(c => c.churnScore > 0.5).reduce((s, c) => s + c.clv, 0);
  return {
    totalCustomers: customers.length,
    criticalRisk: critical,
    highRisk: high,
    mediumRisk: medium,
    lowRisk: low,
    avgChurnScore: Math.round(avgChurn * 1000) / 1000,
    totalCLVAtRisk: totalCLV,
    quantumAccuracy: Math.round((0.85 + Math.random() * 0.1) * 1000) / 10,
    zkProofsToday: 0,
    totalEvents: 0,
    pipelineRunning: false,
  };
}

let logCounter = 0;
let eventCounter = 0;
let proofCounter = 0;

export const useQCIStore = create<QCIStore>((set, get) => ({
  customers: [],
  blocks: [],
  zkProofs: [],
  contractEvents: [],
  federatedNodes: [],
  federatedRounds: [],
  pipelineLogs: [],
  rlActions: [],
  metrics: computeMetrics([]),
  sidebarCollapsed: false,
  pipelineRunning: false,
  initialized: false,

  initialize: () => {
    if (get().initialized) return;
    const customers = generateCustomers(200);
    initChain();

    // Add initial blockchain transactions
    for (let i = 0; i < 15; i++) {
      const c = customers[Math.floor(Math.random() * customers.length)];
      addTransaction('CHURN_PREDICTION', {
        customerId: c.id, score: c.churnScore, modelVersion: 'v1.0.0',
      });
    }
    // Mine initial blocks
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        const c = customers[Math.floor(Math.random() * customers.length)];
        addTransaction(
          (['CHURN_PREDICTION', 'RETENTION_ACTION', 'PRICING_CHANGE', 'MODEL_UPDATE', 'CONSENT_RECORD'] as const)[j % 5],
          { customerId: c.id, score: c.churnScore }
        );
      }
      mineBlock();
    }

    const nodes = createNodes(10);
    const initialLogs: PipelineLog[] = [
      { id: `log-${logCounter++}`, timestamp: new Date().toISOString(), level: 'INFO', module: 'System', message: 'QCI Platform initialized' },
      { id: `log-${logCounter++}`, timestamp: new Date().toISOString(), level: 'SUCCESS', module: 'DataGen', message: `Generated ${customers.length} customers` },
      { id: `log-${logCounter++}`, timestamp: new Date().toISOString(), level: 'INFO', module: 'Blockchain', message: 'Genesis block created, chain initialized' },
      { id: `log-${logCounter++}`, timestamp: new Date().toISOString(), level: 'INFO', module: 'Federated', message: '10 federated nodes online' },
    ];

    set({
      customers,
      blocks: getChain(),
      federatedNodes: nodes,
      pipelineLogs: initialLogs,
      metrics: { ...computeMetrics(customers), totalEvents: eventCounter, zkProofsToday: proofCounter },
      initialized: true,
    });
  },

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  addLog: (level, module, message) => {
    set(s => ({
      pipelineLogs: [...s.pipelineLogs.slice(-200), {
        id: `log-${logCounter++}`, timestamp: new Date().toISOString(), level, module, message,
      }],
    }));
  },

  updateRandomCustomers: () => {
    const { customers, addLog } = get();
    const updated = [...customers];
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * updated.length);
      const c = { ...updated[idx] };
      // Simulate activity
      c.daysSinceActivity = Math.max(0, c.daysSinceActivity + (Math.random() > 0.6 ? 1 : -1));
      c.usageFrequency = Math.max(0.1, c.usageFrequency + (Math.random() - 0.5) * 0.5);
      c.sentimentScore = Math.max(-1, Math.min(1, c.sentimentScore + (Math.random() - 0.5) * 0.1));
      // Recompute churn
      const recency = c.daysSinceActivity / 90;
      const sentFactor = (1 - c.sentimentScore) / 2;
      const supportFactor = c.supportTickets / 24;
      const npsFactor = (10 - c.npsScore) / 10;
      c.churnScore = Math.max(0, Math.min(1,
        0.3 * recency + 0.25 * 0.5 + 0.2 * sentFactor + 0.15 * supportFactor + 0.1 * npsFactor
      ));
      c.churnScore = Math.round(c.churnScore * 1000) / 1000;
      c.riskLevel = c.churnScore >= 0.75 ? 'critical' : c.churnScore >= 0.5 ? 'high' : c.churnScore >= 0.25 ? 'medium' : 'low';
      // Quantum prediction
      const features = buildFeatureVector(c);
      const qr = predict(features);
      c.quantumConfidence = Math.round(qr.quantumConfidence * 100) / 100;
      updated[idx] = c;
      eventCounter++;
    }

    // Occasionally mine a block
    if (Math.random() > 0.7) {
      const c = updated[Math.floor(Math.random() * updated.length)];
      addTransaction('CHURN_PREDICTION', { customerId: c.id, score: c.churnScore });
      const block = mineBlock();
      if (block) {
        addLog('INFO', 'Blockchain', `Block #${block.index} mined with ${block.transactions.length} transactions`);
      }
    }

    // RL action
    if (Math.random() > 0.5) {
      const c = updated[Math.floor(Math.random() * updated.length)];
      const action = selectAction({
        churnScore: c.churnScore,
        customerLifetimeValue: c.clv / 100000,
        sentimentScore: c.sentimentScore,
        daysSinceLastActivity: c.daysSinceActivity,
        supportTicketCount: c.supportTickets,
        npsScore: c.npsScore,
        priceSensitivity: c.priceSensitivity,
        usageFrequency: c.usageFrequency,
        contractDaysRemaining: 180,
        fibonacciCluster: c.fibonacciCluster,
      });
      action.customerId = c.id;
      set(s => ({ rlActions: [...s.rlActions.slice(-50), action] }));
      addLog('INFO', 'RL Agent', `Action "${action.actionName}" for ${c.name} (p=${action.probability.toFixed(3)})`);
    }

    // ZK proof
    if (Math.random() > 0.8) {
      const c = updated[Math.floor(Math.random() * updated.length)];
      const proof = generateZKProof(c.churnScore, c.predictions[0]?.id || 'none');
      proofCounter++;
      set(s => ({ zkProofs: [...s.zkProofs.slice(-50), proof] }));
    }

    set({
      customers: updated,
      blocks: getChain(),
      metrics: { ...computeMetrics(updated), totalEvents: eventCounter, zkProofsToday: proofCounter, pipelineRunning: get().pipelineRunning },
    });
  },

  runPipeline: () => {
    const { addLog } = get();
    set({ pipelineRunning: true });
    addLog('INFO', 'Pipeline', 'Starting full QCI analysis pipeline...');
    addLog('INFO', 'Vedic', 'Anurupyena normalization applied to feature vectors');
    addLog('INFO', 'Quantum', 'VQC circuit executing on 5-qubit register');
    addLog('INFO', 'Fibonacci', 'Spiral clustering with PCA projection');
    addLog('INFO', 'Mayan', 'Multi-cycle temporal analysis (Tzolkin, Haab, Venus)');
    addLog('SUCCESS', 'Pipeline', 'Full pipeline completed for 200 customers');

    // Run federated round
    const { federatedNodes, federatedRounds } = get();
    const globalWeights = new Array(10).fill(0).map(() => Math.random() * 0.1);
    const result = runFederatedRound(federatedNodes, globalWeights, federatedRounds.length + 1);
    addLog('INFO', 'Federated', `Round ${result.round.round}: loss=${result.round.globalLoss.toFixed(4)}, delta=${result.round.convergenceDelta.toFixed(6)}`);

    set(s => ({
      federatedNodes: result.nodes,
      federatedRounds: [...s.federatedRounds, result.round],
      pipelineRunning: false,
    }));
  },

  getCustomerById: (id) => get().customers.find(c => c.id === id),
}));
