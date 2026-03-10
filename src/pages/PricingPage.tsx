import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Play, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import PageWrapper from '@/components/layout/PageWrapper';
import GlowCard from '@/components/shared/GlowCard';
import { useQCIStore } from '@/store/qciStore';
import { optimizePrice } from '@/engine/PricingOptimizer';
import type { PricingResult } from '@/types/customer';

const PricingPage: React.FC = () => {
  const customers = useQCIStore(s => s.customers);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [running, setRunning] = useState(false);
  const [energyProgress, setEnergyProgress] = useState<number[]>([]);

  const filtered = useMemo(() => {
    if (!search) return customers.slice(0, 10);
    const q = search.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q)).slice(0, 10);
  }, [customers, search]);

  const selectedCustomer = customers.find(c => c.id === selectedId);

  const runOptimizer = () => {
    if (!selectedCustomer) return;
    setRunning(true);
    setEnergyProgress([]);
    // Simulate progressive animation
    const r = optimizePrice(selectedCustomer.mrr, selectedCustomer.priceSensitivity, selectedCustomer.churnScore);
    let idx = 0;
    const interval = setInterval(() => {
      idx += 3;
      setEnergyProgress(r.energyHistory.slice(0, idx));
      if (idx >= r.energyHistory.length) {
        clearInterval(interval);
        setResult(r);
        setRunning(false);
      }
    }, 30);
  };

  const energyData = energyProgress.map((e, i) => ({ iteration: i * 10, energy: e }));

  return (
    <PageWrapper title="Dynamic Pricing Optimizer" subtitle="Quantum annealing-powered price optimization">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Customer Selector */}
        <GlowCard color="cyan">
          <h3 className="text-sm font-heading font-semibold mb-3">Select Customer</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
            {filtered.map(c => (
              <button key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${selectedId === c.id ? 'bg-primary/20 text-foreground' : 'hover:bg-secondary/50 text-muted-foreground'}`}>
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 font-mono">${c.mrr}/mo</span>
              </button>
            ))}
          </div>
          {selectedCustomer && (
            <button onClick={runOptimizer} disabled={running}
              className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? 'Optimizing...' : 'Run Quantum Annealing'}
            </button>
          )}
        </GlowCard>

        {/* Energy Convergence */}
        <GlowCard color="purple" className="lg:col-span-2">
          <h3 className="text-sm font-heading font-semibold mb-2">Energy Convergence</h3>
          {energyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={energyData}>
                <XAxis dataKey="iteration" tick={{ fontSize: 9 }} stroke="hsl(var(--qci-text-muted))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--qci-text-muted))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="energy" stroke="#7C3AED" strokeWidth={1.5} dot={false} animationDuration={0} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">Select a customer and run the optimizer</div>
          )}
        </GlowCard>
      </div>

      {result && selectedCustomer && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Results */}
            <GlowCard color="green">
              <h3 className="text-sm font-heading font-semibold mb-3">Optimization Results</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Current Price</p><p className="font-mono font-bold">${result.basePrice}</p></div>
                <div><p className="text-xs text-muted-foreground">Optimal Price</p><p className="font-mono font-bold text-qci-cyan">${result.optimalPrice}</p></div>
                <div><p className="text-xs text-muted-foreground">Discount</p><p className="font-mono font-bold">{Math.round((1 - result.optimalPrice / result.basePrice) * 100)}%</p></div>
                <div><p className="text-xs text-muted-foreground">Expected Retention</p><p className="font-mono font-bold text-qci-green">{result.expectedRetention}%</p></div>
                <div><p className="text-xs text-muted-foreground">Revenue Impact</p><p className={`font-mono font-bold ${result.revenueImpact >= 0 ? 'text-qci-green' : 'text-qci-red'}`}>{result.revenueImpact >= 0 ? '+' : ''}${result.revenueImpact}</p></div>
                <div><p className="text-xs text-muted-foreground">Iterations</p><p className="font-mono">{result.iterationsRun}</p></div>
              </div>
            </GlowCard>

            {/* Elasticity */}
            <GlowCard color="cyan">
              <h3 className="text-sm font-heading font-semibold mb-2">Price Elasticity Curve</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={result.elasticityCurve}>
                  <XAxis dataKey="priceChange" tick={{ fontSize: 9 }} stroke="hsl(var(--qci-text-muted))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--qci-text-muted))" domain={[0, 1]} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <ReferenceLine x={0} stroke="hsl(var(--qci-gold))" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="churnRate" stroke="#0891B2" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </GlowCard>
          </div>

          {/* Bundles */}
          <GlowCard color="gold">
            <h3 className="text-sm font-heading font-semibold mb-3">Bundle Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.bundles.map(b => (
                <motion.div key={b.name}
                  className="p-4 bg-background/50 rounded-lg border border-border hover:border-qci-gold/50 transition-colors"
                  whileHover={{ y: -2 }}
                >
                  <h4 className="font-heading font-bold text-sm mb-1">{b.name} Bundle</h4>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-mono font-bold">${b.price}</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                    <span className="text-xs text-qci-green ml-auto">+{Math.round(b.retentionImpact * 100)}% retention</span>
                  </div>
                  <ul className="space-y-1">
                    {b.features.map(f => <li key={f} className="text-xs text-muted-foreground flex items-center gap-1"><span className="text-qci-cyan">✓</span> {f}</li>)}
                  </ul>
                </motion.div>
              ))}
            </div>
          </GlowCard>

          {/* Comparison Table */}
          <GlowCard color="purple" className="mt-4">
            <h3 className="text-sm font-heading font-semibold mb-3">Price Comparison</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 px-3">Metric</th>
                  <th className="py-2 px-3">Current</th>
                  <th className="py-2 px-3">Optimized</th>
                  <th className="py-2 px-3">Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Monthly Price</td>
                  <td className="py-2 px-3 font-mono">${result.basePrice}</td>
                  <td className="py-2 px-3 font-mono text-qci-cyan">${result.optimalPrice}</td>
                  <td className="py-2 px-3 font-mono">{result.optimalPrice > result.basePrice ? '+' : ''}{Math.round((result.optimalPrice - result.basePrice) / result.basePrice * 100)}%</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Est. Retention</td>
                  <td className="py-2 px-3 font-mono">{Math.round((1 - selectedCustomer.churnScore) * 100)}%</td>
                  <td className="py-2 px-3 font-mono text-qci-green">{result.expectedRetention}%</td>
                  <td className="py-2 px-3 font-mono text-qci-green">+{Math.round(result.expectedRetention - (1 - selectedCustomer.churnScore) * 100)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Annual Revenue</td>
                  <td className="py-2 px-3 font-mono">${(result.basePrice * 12).toLocaleString()}</td>
                  <td className="py-2 px-3 font-mono">${(result.optimalPrice * 12).toLocaleString()}</td>
                  <td className="py-2 px-3 font-mono">${((result.optimalPrice - result.basePrice) * 12).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </GlowCard>
        </>
      )}
    </PageWrapper>
  );
};

export default PricingPage;
