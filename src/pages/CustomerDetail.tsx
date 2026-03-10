import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Mail, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import PageWrapper from '@/components/layout/PageWrapper';
import ChurnGauge from '@/components/shared/ChurnGauge';
import RiskBadge from '@/components/shared/RiskBadge';
import GlowCard from '@/components/shared/GlowCard';
import { useQCIStore } from '@/store/qciStore';
import { optimizePrice } from '@/engine/PricingOptimizer';

const COLORS = ['#0891B2', '#7C3AED', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#3B82F6'];

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customer = useQCIStore(s => s.customers.find(c => c.id === id));

  const [tab, setTab] = React.useState<'overview' | 'predictions' | 'sentiment' | 'blockchain' | 'pricing'>('overview');

  const pricing = useMemo(() => {
    if (!customer) return null;
    return optimizePrice(customer.mrr, customer.priceSensitivity, customer.churnScore);
  }, [customer]);

  if (!customer) {
    return <PageWrapper title="Customer Not Found"><p className="text-muted-foreground">Customer not found.</p></PageWrapper>;
  }

  const sentimentData = customer.sentimentHistory.map((v, i) => ({ day: i + 1, score: v }));
  const activityData = customer.activityHistory.slice(-90).map((v, i) => ({ day: i + 1, events: v }));

  const tabs = ['overview', 'predictions', 'sentiment', 'blockchain', 'pricing'] as const;

  return (
    <PageWrapper title={customer.name} subtitle={`${customer.segment} · ${customer.plan} · ${customer.email}`}>
      <button onClick={() => navigate('/customers')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Matrix
      </button>

      {/* Profile header */}
      <GlowCard color="cyan" className="mb-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-heading font-bold text-qci-cyan">
            {customer.name.charAt(0)}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-muted-foreground">MRR</p><p className="font-mono font-bold">${customer.mrr.toLocaleString()}</p></div>
            <div><p className="text-xs text-muted-foreground">CLV</p><p className="font-mono font-bold">${customer.clv.toLocaleString()}</p></div>
            <div><p className="text-xs text-muted-foreground">Risk Level</p><RiskBadge level={customer.riskLevel} /></div>
            <div><p className="text-xs text-muted-foreground">NPS</p><p className="font-mono font-bold">{customer.npsScore}/10</p></div>
          </div>
          <ChurnGauge score={customer.churnScore} size={120} />
        </div>
      </GlowCard>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-body capitalize border-b-2 transition-colors ${tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlowCard color="cyan">
            <h3 className="text-sm font-heading font-semibold mb-2">Activity Trend (90 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={activityData}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--qci-text-muted))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--qci-text-muted))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="events" stroke="#0891B2" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>
          <GlowCard color="purple">
            <h3 className="text-sm font-heading font-semibold mb-3">Details</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-muted-foreground">Fibonacci Cluster:</span> <span className="font-mono">{customer.fibonacciCluster}</span></div>
              <div><span className="text-muted-foreground">Mayan Cycle:</span> <span className="font-mono">{customer.mayanCycle.dominantCycle}</span></div>
              <div><span className="text-muted-foreground">Next Vulnerable:</span> <span className="font-mono">{customer.mayanCycle.nextVulnerableDate}</span></div>
              <div><span className="text-muted-foreground">Cycle Strength:</span> <span className="font-mono">{(customer.mayanCycle.cycleStrength * 100).toFixed(1)}%</span></div>
              <div><span className="text-muted-foreground">Sentiment:</span> <span className="font-mono">{customer.sentimentTrajectory}</span></div>
              <div><span className="text-muted-foreground">Emotion:</span> <span className="font-mono capitalize">{customer.emotion}</span></div>
              <div><span className="text-muted-foreground">Support Tickets:</span> <span className="font-mono">{customer.supportTickets}</span></div>
              <div><span className="text-muted-foreground">Usage Freq:</span> <span className="font-mono">{customer.usageFrequency.toFixed(1)}/day</span></div>
            </div>
          </GlowCard>
        </div>
      )}

      {tab === 'predictions' && (
        <GlowCard color="cyan">
          <h3 className="text-sm font-heading font-semibold mb-3">Prediction History</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-3">Date</th><th className="py-2 px-3">Score</th><th className="py-2 px-3">Risk</th>
                <th className="py-2 px-3">Q. Confidence</th><th className="py-2 px-3">Model</th><th className="py-2 px-3">Blockchain Hash</th>
              </tr>
            </thead>
            <tbody>
              {customer.predictions.map(p => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="py-2 px-3 font-mono">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 px-3 font-mono">{Math.round(p.score * 100)}%</td>
                  <td className="py-2 px-3"><RiskBadge level={p.riskLevel} /></td>
                  <td className="py-2 px-3 font-mono">{Math.round(p.quantumConfidence * 100)}%</td>
                  <td className="py-2 px-3 font-mono">{p.modelVersion}</td>
                  <td className="py-2 px-3 font-mono text-muted-foreground truncate max-w-[150px]">{p.blockchainHash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlowCard>
      )}

      {tab === 'sentiment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlowCard color="purple">
            <h3 className="text-sm font-heading font-semibold mb-2">Sentiment Over 90 Days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sentimentData}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--qci-text-muted))" />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} stroke="hsl(var(--qci-text-muted))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="score" stroke="#EC4899" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>
          <GlowCard color="purple">
            <h3 className="text-sm font-heading font-semibold mb-2">Current State</h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Trajectory:</span> <span className="font-mono capitalize">{customer.sentimentTrajectory}</span></div>
              <div><span className="text-muted-foreground">Current Score:</span> <span className="font-mono">{customer.sentimentScore.toFixed(2)}</span></div>
              <div><span className="text-muted-foreground">Emotion:</span> <span className="font-mono capitalize">{customer.emotion}</span></div>
              <div><span className="text-muted-foreground">Language:</span> <span className="font-mono">English</span></div>
            </div>
          </GlowCard>
        </div>
      )}

      {tab === 'blockchain' && (
        <GlowCard color="gold">
          <h3 className="text-sm font-heading font-semibold mb-3">Customer Blockchain Transactions</h3>
          <p className="text-xs text-muted-foreground mb-4">All predictions and actions are cryptographically recorded on the QCI chain.</p>
          <div className="space-y-2">
            {customer.predictions.map(p => (
              <div key={p.id} className="p-3 bg-background/50 rounded border border-border/50 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-qci-gold font-mono">CHURN_PREDICTION</span>
                  <span className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="font-mono text-muted-foreground truncate">Hash: {p.blockchainHash}</div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {tab === 'pricing' && pricing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlowCard color="cyan">
            <h3 className="text-sm font-heading font-semibold mb-3">Quantum Annealing Result</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground text-xs">Base Price</span><p className="font-mono font-bold">${pricing.basePrice}</p></div>
              <div><span className="text-muted-foreground text-xs">Optimal Price</span><p className="font-mono font-bold text-qci-cyan">${pricing.optimalPrice}</p></div>
              <div><span className="text-muted-foreground text-xs">Expected Retention</span><p className="font-mono font-bold">{pricing.expectedRetention}%</p></div>
              <div><span className="text-muted-foreground text-xs">Revenue Impact</span><p className={`font-mono font-bold ${pricing.revenueImpact >= 0 ? 'text-qci-green' : 'text-qci-red'}`}>${pricing.revenueImpact}</p></div>
              <div><span className="text-muted-foreground text-xs">Iterations</span><p className="font-mono">{pricing.iterationsRun}</p></div>
              <div><span className="text-muted-foreground text-xs">Convergence Temp</span><p className="font-mono">{pricing.convergenceTemp.toFixed(4)}</p></div>
            </div>
          </GlowCard>
          <GlowCard color="purple">
            <h3 className="text-sm font-heading font-semibold mb-2">Price Elasticity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pricing.elasticityCurve}>
                <XAxis dataKey="priceChange" tick={{ fontSize: 10 }} stroke="hsl(var(--qci-text-muted))" label={{ value: 'Price Change %', position: 'insideBottom', offset: -5, style: { fontSize: 10 } }} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--qci-text-muted))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="churnRate" stroke="#7C3AED" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>
          <GlowCard color="green" className="lg:col-span-2">
            <h3 className="text-sm font-heading font-semibold mb-3">Bundle Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricing.bundles.map(b => (
                <div key={b.name} className="p-4 bg-background/50 rounded-lg border border-border">
                  <h4 className="font-heading font-bold text-sm mb-2">{b.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">${b.price}/mo · +{Math.round(b.retentionImpact * 100)}% retention</p>
                  <ul className="space-y-1">
                    {b.features.map(f => <li key={f} className="text-xs text-muted-foreground">• {f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      )}
    </PageWrapper>
  );
};

export default CustomerDetail;
