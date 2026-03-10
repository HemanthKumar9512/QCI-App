// Quantum Circuit Simulation — 5-qubit VQC with real matrix math
import type { QuantumCircuitResult } from '@/types/prediction';

interface Complex { real: number; imag: number; }

function complexMul(a: Complex, b: Complex): Complex {
  return { real: a.real * b.real - a.imag * b.imag, imag: a.real * b.imag + a.imag * b.real };
}
function complexAdd(a: Complex, b: Complex): Complex {
  return { real: a.real + b.real, imag: a.imag + b.imag };
}
function complexAbs2(a: Complex): number {
  return a.real * a.real + a.imag * a.imag;
}

type Gate = Complex[][];

const H_GATE: Gate = [
  [{ real: 1/Math.SQRT2, imag: 0 }, { real: 1/Math.SQRT2, imag: 0 }],
  [{ real: 1/Math.SQRT2, imag: 0 }, { real: -1/Math.SQRT2, imag: 0 }],
];
const X_GATE: Gate = [
  [{ real: 0, imag: 0 }, { real: 1, imag: 0 }],
  [{ real: 1, imag: 0 }, { real: 0, imag: 0 }],
];
function ryGate(theta: number): Gate {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  return [
    [{ real: c, imag: 0 }, { real: -s, imag: 0 }],
    [{ real: s, imag: 0 }, { real: c, imag: 0 }],
  ];
}

const NUM_QUBITS = 5;
const DIM = 1 << NUM_QUBITS; // 32

function initState(): Complex[] {
  const state = new Array<Complex>(DIM).fill({ real: 0, imag: 0 });
  state[0] = { real: 1, imag: 0 };
  return state.map(c => ({ ...c }));
}

function applySingleQubitGate(state: Complex[], qubit: number, gate: Gate): Complex[] {
  const newState = state.map(c => ({ ...c }));
  const step = 1 << qubit;
  for (let i = 0; i < DIM; i++) {
    if ((i & step) === 0) {
      const j = i | step;
      const a = state[i];
      const b = state[j];
      newState[i] = complexAdd(complexMul(gate[0][0], a), complexMul(gate[0][1], b));
      newState[j] = complexAdd(complexMul(gate[1][0], a), complexMul(gate[1][1], b));
    }
  }
  return newState;
}

function applyCNOT(state: Complex[], control: number, target: number): Complex[] {
  const newState = state.map(c => ({ ...c }));
  const cBit = 1 << control;
  const tBit = 1 << target;
  for (let i = 0; i < DIM; i++) {
    if ((i & cBit) !== 0 && (i & tBit) === 0) {
      const j = i | tBit;
      const tmp = newState[i];
      newState[i] = newState[j];
      newState[j] = tmp;
    }
  }
  return newState;
}

function encodeFeatures(features: number[], params: number[]): number[] {
  const angles: number[] = [];
  for (let i = 0; i < NUM_QUBITS; i++) {
    const fi = features[i % features.length] || 0;
    angles.push(Math.atan(fi) * Math.PI + (params[i] || 0));
  }
  return angles;
}

function runCircuit(features: number[], params: number[]): { state: Complex[]; gates: string[] } {
  const angles = encodeFeatures(features, params);
  const gates: string[] = [];
  let state = initState();

  // Layer 1: Hadamard on all qubits
  for (let q = 0; q < NUM_QUBITS; q++) {
    state = applySingleQubitGate(state, q, H_GATE);
    gates.push(`H(q${q})`);
  }

  // Layer 2: Feature encoding Ry rotations
  for (let q = 0; q < NUM_QUBITS; q++) {
    state = applySingleQubitGate(state, q, ryGate(angles[q]));
    gates.push(`Ry(${angles[q].toFixed(2)},q${q})`);
  }

  // Layer 3: Entanglement
  for (let q = 0; q < NUM_QUBITS - 1; q++) {
    state = applyCNOT(state, q, q + 1);
    gates.push(`CNOT(q${q},q${q + 1})`);
  }

  // Layer 4: Second variational layer
  for (let q = 0; q < NUM_QUBITS; q++) {
    const p = params[NUM_QUBITS + q] || 0;
    state = applySingleQubitGate(state, q, ryGate(p));
    gates.push(`Ry(${p.toFixed(2)},q${q})`);
  }

  // Layer 5: More entanglement
  for (let q = NUM_QUBITS - 1; q > 0; q--) {
    state = applyCNOT(state, q, q - 1);
    gates.push(`CNOT(q${q},q${q - 1})`);
  }

  // Layer 6: Final rotations
  for (let q = 0; q < NUM_QUBITS; q++) {
    const p = params[2 * NUM_QUBITS + q] || 0;
    state = applySingleQubitGate(state, q, ryGate(p));
    gates.push(`Ry(${p.toFixed(2)},q${q})`);
  }

  return { state, gates };
}

function measure(state: Complex[]): { churnProbability: number; quantumConfidence: number } {
  let churnProb = 0;
  let maxProb = 0;
  for (let i = 0; i < DIM; i++) {
    const p = complexAbs2(state[i]);
    if (p > maxProb) maxProb = p;
    // States where qubit 0 is |1⟩ indicate churn
    if (i & 1) churnProb += p;
  }
  return { churnProbability: Math.min(1, Math.max(0, churnProb)), quantumConfidence: maxProb };
}

export function initializeParams(): number[] {
  return Array.from({ length: NUM_QUBITS * 3 }, () => (Math.random() - 0.5) * Math.PI);
}

let globalParams = initializeParams();

export function predict(features: number[]): QuantumCircuitResult {
  const { state, gates } = runCircuit(features.slice(0, 10), globalParams);
  const { churnProbability, quantumConfidence } = measure(state);
  return {
    churnProbability,
    quantumConfidence,
    statevector: state,
    circuitDepth: 6,
    gateSequence: gates,
    parameters: [...globalParams],
  };
}

export function trainStep(features: number[], label: number, lr = 0.01): number {
  const paramShiftGrads: number[] = [];
  for (let i = 0; i < globalParams.length; i++) {
    const paramsPlus = [...globalParams];
    paramsPlus[i] += Math.PI / 2;
    const { state: sp } = runCircuit(features.slice(0, 10), paramsPlus);
    const fp = measure(sp).churnProbability;

    const paramsMinus = [...globalParams];
    paramsMinus[i] -= Math.PI / 2;
    const { state: sm } = runCircuit(features.slice(0, 10), paramsMinus);
    const fm = measure(sm).churnProbability;

    paramShiftGrads.push((fp - fm) / 2);
  }
  // MSE gradient
  const { churnProbability } = predict(features);
  const error = churnProbability - label;
  for (let i = 0; i < globalParams.length; i++) {
    globalParams[i] -= lr * error * paramShiftGrads[i];
  }
  return error * error;
}

export function getParameters(): number[] { return [...globalParams]; }
export function setParameters(p: number[]) { globalParams = [...p]; }
export function getStatevectorProbabilities(features: number[]): number[] {
  const { state } = runCircuit(features.slice(0, 10), globalParams);
  return state.map(c => complexAbs2(c));
}
