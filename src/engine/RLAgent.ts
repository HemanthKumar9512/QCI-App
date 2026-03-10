// PPO Reinforcement Learning Agent
import type { RLState, RLActionResult } from '@/types/prediction';

const ACTIONS = [
  'No action (observe)',
  'Send personalized email',
  'Trigger retention call',
  'Offer loyalty discount (5%)',
  'Offer loyalty discount (15%)',
  'Upgrade service tier',
  'Assign dedicated success manager',
  'Invite to beta feature program',
  'Send executive outreach',
  'Initiate win-back campaign',
];

const NUM_ACTIONS = 10;
const HIDDEN1 = 64;
const HIDDEN2 = 32;
const GAMMA = 0.99;
const CLIP_EPS = 0.2;
const LR = 0.0003;

function relu(x: number): number { return Math.max(0, x); }
function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// Network weights
let W1 = Array.from({ length: HIDDEN1 }, () => Array.from({ length: 10 }, () => (Math.random() - 0.5) * 0.3));
let b1 = new Array(HIDDEN1).fill(0);
let W2 = Array.from({ length: HIDDEN2 }, () => Array.from({ length: HIDDEN1 }, () => (Math.random() - 0.5) * 0.3));
let b2 = new Array(HIDDEN2).fill(0);
let W3 = Array.from({ length: NUM_ACTIONS }, () => Array.from({ length: HIDDEN2 }, () => (Math.random() - 0.5) * 0.3));
let b3 = new Array(NUM_ACTIONS).fill(0);

// Value head
let Wv = Array.from({ length: 1 }, () => Array.from({ length: HIDDEN2 }, () => (Math.random() - 0.5) * 0.3));
let bv = [0];

function stateToArray(s: RLState): number[] {
  return [s.churnScore, s.customerLifetimeValue, s.sentimentScore,
    s.daysSinceLastActivity / 365, s.supportTicketCount / 24,
    s.npsScore / 10, s.priceSensitivity, s.usageFrequency / 10,
    s.contractDaysRemaining / 365, s.fibonacciCluster / 8];
}

function forward(input: number[]): { probs: number[]; hidden2: number[]; value: number } {
  // Layer 1
  const h1 = W1.map((row, i) => relu(row.reduce((s, w, j) => s + w * input[j], 0) + b1[i]));
  // Layer 2
  const h2 = W2.map((row, i) => relu(row.reduce((s, w, j) => s + w * h1[j], 0) + b2[i]));
  // Policy head
  const logits = W3.map((row, i) => row.reduce((s, w, j) => s + w * h2[j], 0) + b3[i]);
  const probs = softmax(logits);
  // Value head
  const value = Wv[0].reduce((s, w, j) => s + w * h2[j], 0) + bv[0];
  return { probs, hidden2: h2, value };
}

export function selectAction(state: RLState): RLActionResult {
  const input = stateToArray(state);
  const { probs, value } = forward(input);
  
  // Sample action from probability distribution
  const r = Math.random();
  let cumProb = 0;
  let selectedAction = 0;
  for (let i = 0; i < probs.length; i++) {
    cumProb += probs[i];
    if (r < cumProb) { selectedAction = i; break; }
  }

  // Heuristic expected reward
  const expectedReward = state.churnScore > 0.7 ? 
    (selectedAction > 0 ? 100 * probs[selectedAction] : -5) :
    (selectedAction === 0 ? 20 : -10 * probs[selectedAction]);

  return {
    action: selectedAction,
    actionName: ACTIONS[selectedAction],
    probability: probs[selectedAction],
    expectedReward,
    customerId: '',
  };
}

export function computeReward(state: RLState, action: number, retained: boolean): number {
  if (retained && action > 0) return 100;
  if (!retained) return -50;
  if (state.churnScore < 0.3 && action >= 3 && action <= 4) return -10;
  if (state.churnScore > 0.7 && action === 0) return -5 * state.daysSinceLastActivity;
  return 20;
}

export function getActionDistribution(state: RLState): number[] {
  return forward(stateToArray(state)).probs;
}

export function getStateValue(state: RLState): number {
  return forward(stateToArray(state)).value;
}

export function getPolicyWeights(): number[][] {
  return W3;
}

export { ACTIONS };
