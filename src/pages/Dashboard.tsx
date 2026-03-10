import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, BarChart3, DollarSign, Atom, Shield, Play, Check
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import MetricCard from '@/components/shared/MetricCard';
import GlowCard from '@/components/shared/GlowCard';
import RiskBadge from '@/components/shared/RiskBadge';
import { useQCIStore } from '@/store/qciStore';

const Dashboard: React.FC = () => {
  const metrics = useQCIStore(s => s.metrics);
  const logs = useQCIStore(s => s.pipelineLogs);
  const blocks = useQCIStore(s => s.blocks);
  const rlActions = useQCIStore(s => s.rlActions);
  const customers = useQCIStore(s => s.customers);
  const pipelineRunning = useQCIStore(s => s.pipelineRunning);
  const runPipeline = useQCIStore(s => s.runPipeline);

  const logEndRef = React.useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  React.useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, autoScroll]);

  const riskCounts = {
    critical: metrics.criticalRisk,
    high: metrics.highRisk,
    medium: metrics.mediumRisk,
    low: metrics.lowRisk,
  };

  const logColors: Record<string, string> = {
    INFO: 'text-qci-cyan', WARN: 'text-qci-gold', ERROR: 'text-qci-red', SUCCESS: 'text-qci-green',
  };

  return (
    <PageWrapper title="Command Center" subtitle="Real-time quantum intelligence overview">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard label="Total Events" value={metrics.totalEvents} color="cyan" icon={Activity} trend={12} />
        <MetricCard label="Critical Risk" value={metrics.criticalRisk} color="red" icon={AlertTriangle} trend={-3} />
        <MetricCard label="Avg Churn Score" value={Math.round(metrics.avgChurnScore * 100)} format="percent" color="gold" icon={BarChart3} />
        <MetricCard label="CLV at Risk" value={metrics.totalCLVAtRisk} format="currency" color="purple" icon={DollarSign} />
        <MetricCard label="Quantum Accuracy" value={metrics.quantumAccuracy} format="percent" color="blue" icon={Atom} />
        <MetricCard label="ZK Proofs Today" value={metrics.zkProofsToday} color="green" icon={Shield} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Risk Distribution */}
        <GlowCard color="cyan">
          <h3 className="text-sm font-heading font-semibold mb-3">Risk Distribution</h3>
          <div className="space-y-3">
            {(['critical', 'high', 'medium', 'low'] as const).map(level => {
              const count = riskCounts[level];
              const pct = metrics.totalCustomers > 0 ? (count / metrics.totalCustomers) * 100 : 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <RiskBadge level={level} />
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        level === 'critical' ? 'bg-qci-red' :
                        level === 'high' ? 'bg-qci-gold' :
                        level === 'medium' ? 'bg-qci-blue' : 'bg-qci-green'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </GlowCard>

        {/* Live Event Feed */}
        <GlowCard color="purple">
          <h3 className="text-sm font-heading font-semibold mb-3">Live Event Feed</h3>
          <div
            className="h-48 overflow-y-auto scrollbar-thin space-y-1"
            onScroll={(e) => {
              const el = e.currentTarget;
              setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 50);
            }}
          >
            {rlActions.slice(-20).map((a, i) => (
              <div key={i} className="text-xs py-1 border-b border-border/50 flex justify-between">
                <span className="text-muted-foreground truncate flex-1">{a.actionName}</span>
                <span className="text-qci-purple font-mono ml-2">{(a.probability * 100).toFixed(1)}%</span>
              </div>
            ))}
            {rlActions.length === 0 && <p className="text-xs text-muted-foreground">Waiting for events...</p>}
          </div>
        </GlowCard>

        {/* Blockchain Latest */}
        <GlowCard color="gold">
          <h3 className="text-sm font-heading font-semibold mb-3">Latest Blocks</h3>
          <div className="space-y-2">
            {blocks.slice(-5).reverse().map(b => (
              <div key={b.index} className="text-xs py-1.5 border-b border-border/50">
                <div className="flex justify-between">
                  <span className="font-mono text-qci-gold">Block #{b.index}</span>
                  <span className="text-muted-foreground">{b.transactions.length} txs</span>
                </div>
                <p className="text-muted-foreground font-mono truncate mt-0.5">{b.hash.slice(0, 24)}...</p>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Pipeline Console */}
        <GlowCard color="cyan" className="col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-semibold">AI Pipeline Console</h3>
            <button
              onClick={runPipeline}
              disabled={pipelineRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-body hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {pipelineRunning ? <Check className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {pipelineRunning ? 'Running...' : 'Run Pipeline'}
            </button>
          </div>
          <div
            className="h-56 overflow-y-auto scrollbar-thin bg-background/50 rounded p-3 font-mono text-xs space-y-0.5"
            onScroll={(e) => {
              const el = e.currentTarget;
              setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 50);
            }}
          >
            {logs.slice(-50).map(log => (
              <div key={log.id} className="flex gap-2">
                <span className="text-muted-foreground w-16 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`w-12 flex-shrink-0 ${logColors[log.level] || ''}`}>[{log.level}]</span>
                <span className="text-qci-purple w-20 flex-shrink-0">{log.module}</span>
                <span>{log.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </GlowCard>

        {/* Top Risk Customers */}
        <GlowCard color="red">
          <h3 className="text-sm font-heading font-semibold mb-3">Top Risk Customers</h3>
          <div className="space-y-2">
            {customers
              .sort((a, b) => b.churnScore - a.churnScore)
              .slice(0, 8)
              .map(c => (
                <div key={c.id} className="flex items-center gap-3 text-xs py-1 border-b border-border/50">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-heading font-bold text-qci-cyan">
                    {c.name.charAt(0)}
                  </div>
                  <span className="flex-1 truncate">{c.name}</span>
                  <RiskBadge level={c.riskLevel} />
                  <span className="font-mono w-12 text-right">{Math.round(c.churnScore * 100)}%</span>
                </div>
              ))}
          </div>
        </GlowCard>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
