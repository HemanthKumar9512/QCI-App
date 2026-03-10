// Federated Learning with FedAvg and Differential Privacy
import type { FederatedNode, FederatedRound } from '@/types/prediction';

const EPSILON = 0.1;
const DELTA = 1e-5;
const SENSITIVITY = 1.0;

function gaussianNoise(sigma: number): number {
  // Box-Muller transform
  const u1 = Math.random() || 1e-10;
  const u2 = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function dpSigma(): number {
  return SENSITIVITY * Math.sqrt(2 * Math.log(1.25 / DELTA)) / EPSILON;
}

function localTrain(weights: number[], data: number[][], labels: number[], epochs: number, lr: number): number[] {
  const w = [...weights];
  for (let ep = 0; ep < epochs; ep++) {
    for (let i = 0; i < data.length; i++) {
      const x = data[i];
      const pred = x.reduce((s, v, j) => s + v * (w[j] || 0), 0);
      const error = pred - labels[i];
      for (let j = 0; j < w.length; j++) {
        w[j] -= lr * error * (x[j] || 0);
      }
    }
  }
  // Add DP noise
  const sigma = dpSigma();
  return w.map(wi => wi + gaussianNoise(sigma));
}

export function createNodes(numNodes: number = 10): FederatedNode[] {
  const regions = ['US-East', 'US-West', 'EU-West', 'EU-Central', 'Asia-Pacific',
    'South-America', 'Middle-East', 'Africa', 'Oceania', 'Canada'];
  return regions.slice(0, numNodes).map((region, i) => ({
    nodeId: `node-${i}`,
    region,
    dataSize: 100 + Math.floor(Math.random() * 900),
    currentLoss: 1 + Math.random(),
    lastSyncAt: new Date().toISOString(),
    weights: Array.from({ length: 10 }, () => (Math.random() - 0.5) * 0.1),
    status: 'synced' as const,
  }));
}

export function fedAvgAggregate(nodes: FederatedNode[]): number[] {
  const totalData = nodes.reduce((s, n) => s + n.dataSize, 0);
  const numWeights = nodes[0]?.weights.length || 10;
  const aggregated = new Array(numWeights).fill(0);
  for (const node of nodes) {
    const fraction = node.dataSize / totalData;
    for (let k = 0; k < numWeights; k++) {
      aggregated[k] += fraction * (node.weights[k] || 0);
    }
  }
  return aggregated;
}

export function runFederatedRound(
  nodes: FederatedNode[],
  globalWeights: number[],
  roundNum: number
): { nodes: FederatedNode[]; round: FederatedRound; newGlobalWeights: number[] } {
  // Each node trains locally
  const updatedNodes = nodes.map(node => {
    // Generate synthetic local data
    const localData = Array.from({ length: node.dataSize }, () =>
      Array.from({ length: 10 }, () => Math.random())
    );
    const localLabels = localData.map(x =>
      x.reduce((s, v, j) => s + v * (globalWeights[j] || 0), 0) + (Math.random() - 0.5) * 0.1
    );
    const newWeights = localTrain([...globalWeights], localData, localLabels, 5, 0.001);
    const loss = localData.reduce((s, x, i) => {
      const pred = x.reduce((ss, v, j) => ss + v * (newWeights[j] || 0), 0);
      return s + (pred - localLabels[i]) ** 2;
    }, 0) / localData.length;

    return { ...node, weights: newWeights, currentLoss: loss, lastSyncAt: new Date().toISOString(), status: 'synced' as const };
  });

  const newGlobalWeights = fedAvgAggregate(updatedNodes);
  const globalLoss = updatedNodes.reduce((s, n) => s + n.currentLoss * n.dataSize, 0) /
    updatedNodes.reduce((s, n) => s + n.dataSize, 0);
  const prevLoss = nodes.reduce((s, n) => s + n.currentLoss, 0) / nodes.length;

  return {
    nodes: updatedNodes,
    round: {
      round: roundNum,
      globalLoss,
      participatingNodes: updatedNodes.length,
      convergenceDelta: Math.abs(globalLoss - prevLoss),
      timestamp: new Date().toISOString(),
    },
    newGlobalWeights,
  };
}
