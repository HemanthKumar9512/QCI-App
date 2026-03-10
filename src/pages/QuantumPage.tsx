import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import PageWrapper from '@/components/layout/PageWrapper';
import GlowCard from '@/components/shared/GlowCard';
import { useQCIStore } from '@/store/qciStore';
import { getStatevectorProbabilities, getParameters, setParameters, initializeParams, trainStep } from '@/engine/QuantumCircuit';
import { buildFeatureVector } from '@/engine/VedicPreprocessor';

const GATE_NAMES = ['H', 'Ry', 'CNOT', 'Ry', 'CNOT', 'Ry'];
const QUBIT_LABELS = ['q₀', 'q₁', 'q₂', 'q₃', 'q₄'];

const QuantumPage: React.FC = () => {
  const federatedNodes = useQCIStore(s => s.federatedNodes);
  const federatedRounds = useQCIStore(s => s.federatedRounds);
  const customers = useQCIStore(s => s.customers);

  const [playing, setPlaying] = useState(false);
  const [activeCol, setActiveCol] = useState(0);
  const [params, setLocalParams] = useState(getParameters);
  const [trainingLoss, setTrainingLoss] = useState<number[]>([]);

  // Circuit animation
  React.useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setActiveCol(c => (c + 1) % 6);
    }, 600);
    return () => clearInterval(interval);
  }, [playing]);

  const stepCircuit = () => setActiveCol(c => (c + 1) % 6);

  // Get probabilities for current params
  const sampleCustomer = customers[0];
  const features = sampleCustomer ? buildFeatureVector(sampleCustomer) : Array(10).fill(0.5);
  const probs = useMemo(() => getStatevectorProbabilities(features), [params, features]);

  // Top 16 basis states for display
  const probData = useMemo(() => {
    return probs.map((p, i) => ({
      state: `|${i.toString(2).padStart(5, '0')}⟩`,
      probability: Math.round(p * 10000) / 10000,
    })).sort((a, b) => b.probability - a.probability).slice(0, 16);
  }, [probs]);

  const handleParamChange = (idx: number, val: number) => {
    const newParams = [...params];
    newParams[idx] = val;
    setLocalParams(newParams);
    setParameters(newParams);
  };

  const handleTrain = () => {
    const losses: number[] = [...trainingLoss];
    for (let i = 0; i < 10; i++) {
      const c = customers[Math.floor(Math.random() * customers.length)];
      const f = buildFeatureVector(c);
      const label = c.churnScore;
      const loss = trainStep(f, label, 0.01);
      losses.push(loss);
    }
    setTrainingLoss(losses.slice(-100));
    setLocalParams(getParameters());
  };

  const lossData = trainingLoss.map((l, i) => ({ step: i, loss: l }));

  return (
    <PageWrapper title="Quantum Engine" subtitle="5-qubit Variational Quantum Circuit visualization">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Circuit Diagram */}
        <GlowCard color="purple" className="col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-semibold">VQC Circuit (5 qubits × 6 layers)</h3>
            <div className="flex gap-1">
              <button onClick={() => setPlaying(!playing)}
                className="p-1.5 bg-secondary rounded hover:bg-secondary/80 transition-colors">
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={stepCircuit} className="p-1.5 bg-secondary rounded hover:bg-secondary/80 transition-colors">
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <svg width="520" height="220" viewBox="0 0 520 220">
              {/* Qubit lines */}
              {QUBIT_LABELS.map((label, q) => (
                <g key={q}>
                  <text x="10" y={30 + q * 40 + 5} fill="hsl(var(--qci-text-secondary))" fontSize="11" fontFamily="var(--font-mono)">{label}</text>
                  <line x1="40" y1={30 + q * 40} x2="510" y2={30 + q * 40} stroke="hsl(var(--qci-border))" strokeWidth="1" />
                </g>
              ))}
              {/* Gates */}
              {GATE_NAMES.map((gate, col) => (
                <g key={col}>
                  {QUBIT_LABELS.map((_, q) => {
                    const x = 70 + col * 75;
                    const y = 30 + q * 40;
                    const isActive = col <= activeCol;
                    const isCurrent = col === activeCol;
                    if (gate === 'CNOT' && q < 4) {
                      return (
                        <g key={`${col}-${q}`}>
                          <circle cx={x} cy={y} r="6" fill={isActive ? '#7C3AED' : 'transparent'} stroke={isActive ? '#7C3AED' : 'hsl(var(--qci-border))'} strokeWidth="1.5" opacity={isCurrent ? 1 : 0.6} />
                          <line x1={x} y1={y + 6} x2={x} y2={y + 40 - 6} stroke={isActive ? '#7C3AED' : 'hsl(var(--qci-border))'} strokeWidth="1" />
                          <circle cx={x} cy={y + 40} r="8" fill="none" stroke={isActive ? '#7C3AED' : 'hsl(var(--qci-border))'} strokeWidth="1.5" />
                          <line x1={x - 5} y1={y + 40} x2={x + 5} y2={y + 40} stroke={isActive ? '#7C3AED' : 'hsl(var(--qci-border))'} strokeWidth="1.5" />
                          <line x1={x} y1={y + 35} x2={x} y2={y + 45} stroke={isActive ? '#7C3AED' : 'hsl(var(--qci-border))'} strokeWidth="1.5" />
                        </g>
                      );
                    }
                    if (gate === 'CNOT' && q === 4) return null;
                    return (
                      <g key={`${col}-${q}`}>
                        <motion.rect
                          x={x - 16} y={y - 14} width="32" height="28" rx="4"
                          fill={isActive ? (gate === 'H' ? '#0891B2' : '#7C3AED') : 'hsl(var(--qci-bg-input))'}
                          stroke={isActive ? (gate === 'H' ? '#06B6D4' : '#9333EA') : 'hsl(var(--qci-border))'}
                          strokeWidth="1"
                          animate={{ opacity: isCurrent ? [0.6, 1, 0.6] : (isActive ? 0.8 : 0.4) }}
                          transition={isCurrent ? { repeat: Infinity, duration: 0.6 } : {}}
                        />
                        <text x={x} y={y + 4} textAnchor="middle" fill="hsl(var(--qci-text))" fontSize="10" fontFamily="var(--font-mono)">{gate}</text>
                      </g>
                    );
                  })}
                </g>
              ))}
            </svg>
          </div>
        </GlowCard>

        {/* Probability Distribution */}
        <GlowCard color="cyan">
          <h3 className="text-sm font-heading font-semibold mb-2">State Probability Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={probData}>
              <XAxis dataKey="state" tick={{ fontSize: 8, fontFamily: 'var(--font-mono)' }} stroke="hsl(var(--qci-text-muted))" angle={-45} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--qci-text-muted))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
              <Bar dataKey="probability" fill="#0891B2" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>

      {/* Parameter sliders and training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <GlowCard color="purple">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-semibold">Circuit Parameters (θ)</h3>
            <button onClick={() => { setLocalParams(initializeParams()); setParameters(initializeParams()); }}
              className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80">Reset</button>
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
            {params.map((p, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-xs font-mono text-muted-foreground w-8">θ{i}</span>
                <input type="range" min={-3.14} max={3.14} step={0.01} value={p}
                  onChange={e => handleParamChange(i, +e.target.value)}
                  className="flex-1 accent-qci-purple h-1" />
                <span className="text-xs font-mono w-10 text-right">{p.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </GlowCard>

        <GlowCard color="cyan">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-semibold">Training Loss</h3>
            <button onClick={handleTrain}
              className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity">
              Train 10 Steps
            </button>
          </div>
          {lossData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={lossData}>
                <XAxis dataKey="step" tick={{ fontSize: 9 }} stroke="hsl(var(--qci-text-muted))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--qci-text-muted))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="loss" stroke="#0891B2" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground py-8 text-center">Click "Train" to start optimization</p>
          )}
        </GlowCard>
      </div>

      {/* Federated Nodes */}
      <GlowCard color="green">
        <h3 className="text-sm font-heading font-semibold mb-3">Federated Learning Nodes</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {federatedNodes.map(node => (
            <div key={node.nodeId} className="p-3 bg-background/50 rounded border border-border/50 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-semibold text-qci-green">{node.nodeId}</span>
                <span className={`w-2 h-2 rounded-full ${node.status === 'synced' ? 'bg-qci-green' : node.status === 'training' ? 'bg-qci-gold animate-pulse' : 'bg-qci-red'}`} />
              </div>
              <p className="text-muted-foreground">{node.region}</p>
              <p className="font-mono mt-1">Data: {node.dataSize}</p>
              <p className="font-mono">Loss: {node.currentLoss.toFixed(4)}</p>
            </div>
          ))}
        </div>
      </GlowCard>
    </PageWrapper>
  );
};

export default QuantumPage;
