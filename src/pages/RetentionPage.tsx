import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';
import PageWrapper from '@/components/layout/PageWrapper';
import GlowCard from '@/components/shared/GlowCard';
import RiskBadge from '@/components/shared/RiskBadge';
import { useQCIStore } from '@/store/qciStore';
import { ACTIONS, getActionDistribution, getPolicyWeights } from '@/engine/RLAgent';

const STRATEGIES = [
  { name: 'Personalized Email', successRate: 78, revenueSaved: 12400, usage: 342 },
  { name: 'Retention Call', successRate: 85, revenueSaved: 28900, usage: 128 },
  { name: 'Loyalty Discount 5%', successRate: 62, revenueSaved: 8200, usage: 456 },
  { name: 'Loyalty Discount 15%', successRate: 71, revenueSaved: 15600, usage: 234 },
  { name: 'Service Upgrade', successRate: 89, revenueSaved: 34200, usage: 89 },
  { name: 'Success Manager', successRate: 92, revenueSaved: 52800, usage: 45 },
  { name: 'Beta Program', successRate: 68, revenueSaved: 9800, usage: 167 },
  { name: 'Executive Outreach', successRate: 94, revenueSaved: 67000, usage: 23 },
  { name: 'Win-back Campaign', successRate: 34, revenueSaved: 4200, usage: 78 },
  { name: 'No Action', successRate: 15, revenueSaved: 0, usage: 890 },
];

const COLORS = ['#0891B2', '#7C3AED', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#3B82F6', '#06B6D4', '#9333EA', '#475569'];

const RetentionPage: React.FC = () => {
  const customers = useQCIStore(s => s.customers);
  const rlActions = useQCIStore(s => s.rlActions);

  // Action distribution from a sample customer
  const sampleState = {
    churnScore: 0.6, customerLifetimeValue: 0.5, sentimentScore: -0.2,
    daysSinceLastActivity: 14, supportTicketCount: 5, npsScore: 5,
    priceSensitivity: 0.6, usageFrequency: 3, contractDaysRemaining: 90, fibonacciCluster: 3,
  };
  const actionDist = getActionDistribution(sampleState);
  const pieData = ACTIONS.map((name, i) => ({ name: name.split(' ').slice(0, 2).join(' '), value: Math.round(actionDist[i] * 1000) / 10 }));

  // Pending actions
  const pendingActions = rlActions.filter(a => a.action > 0).slice(-10).reverse();

  // Win-back candidates
  const winbacks = customers.filter(c => c.churnScore > 0.8).slice(0, 8);

  return (
    <PageWrapper title="Retention Strategy Center" subtitle="RL-powered retention intelligence">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Strategy Playbook */}
        <GlowCard color="cyan" className="lg:col-span-2">
          <h3 className="text-sm font-heading font-semibold mb-3">Strategy Playbook</h3>
          <div className="space-y-2">
            {STRATEGIES.sort((a, b) => b.successRate - a.successRate).map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 text-xs py-1.5">
                <span className="w-4 text-muted-foreground font-mono">{i + 1}</span>
                <span className="flex-1 truncate">{s.name}</span>
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-qci-cyan rounded-full" style={{ width: `${s.successRate}%` }} />
                </div>
                <span className="font-mono w-10 text-right">{s.successRate}%</span>
                <span className="font-mono text-muted-foreground w-20 text-right">${s.revenueSaved.toLocaleString()}</span>
                <span className="font-mono text-muted-foreground w-12 text-right">{s.usage}×</span>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Action Distribution */}
        <GlowCard color="purple">
          <h3 className="text-sm font-heading font-semibold mb-3">RL Action Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Action Queue */}
        <GlowCard color="green">
          <h3 className="text-sm font-heading font-semibold mb-3">Action Queue (AI Recommended)</h3>
          <div className="space-y-2">
            {pendingActions.map((a, i) => {
              const customer = customers.find(c => c.id === a.customerId);
              return (
                <div key={i} className="flex items-center gap-3 p-2 bg-background/50 rounded border border-border/50 text-xs">
                  <div className="flex-1">
                    <p className="font-medium">{customer?.name || 'Unknown'}</p>
                    <p className="text-muted-foreground">{a.actionName}</p>
                  </div>
                  <span className="font-mono text-qci-purple">{(a.probability * 100).toFixed(1)}%</span>
                  <button className="px-2 py-1 bg-qci-green/20 text-qci-green rounded text-xs hover:bg-qci-green/30">Approve</button>
                  <button className="px-2 py-1 bg-qci-red/20 text-qci-red rounded text-xs hover:bg-qci-red/30">Reject</button>
                </div>
              );
            })}
            {pendingActions.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No pending actions</p>}
          </div>
        </GlowCard>

        {/* Win-back Tracker */}
        <GlowCard color="red">
          <h3 className="text-sm font-heading font-semibold mb-3">Win-Back Candidates</h3>
          <div className="space-y-2">
            {winbacks.map(c => (
              <div key={c.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/50">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-heading font-bold text-qci-red text-xs">
                  {c.name.charAt(0)}
                </div>
                <span className="flex-1 truncate">{c.name}</span>
                <RiskBadge level={c.riskLevel} />
                <span className="font-mono">${c.mrr}/mo</span>
                <span className="font-mono text-qci-red">{Math.round(c.churnScore * 100)}%</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>
    </PageWrapper>
  );
};

export default RetentionPage;
