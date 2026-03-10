import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Download, ChevronUp, ChevronDown } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import RiskBadge from '@/components/shared/RiskBadge';
import { useQCIStore } from '@/store/qciStore';
import type { Customer, RiskLevel, Segment } from '@/types/customer';

type SortKey = 'name' | 'churnScore' | 'mrr' | 'clv' | 'sentimentScore' | 'daysSinceActivity' | 'quantumConfidence';

const Customers: React.FC = () => {
  const customers = useQCIStore(s => s.customers);
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [segmentFilter, setSegmentFilter] = useState<Segment | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('churnScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [churnRange, setChurnRange] = useState<[number, number]>([0, 100]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }, [sortKey]);

  const filtered = useMemo(() => {
    let result = customers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.segment.toLowerCase().includes(q));
    }
    if (riskFilter !== 'all') result = result.filter(c => c.riskLevel === riskFilter);
    if (segmentFilter !== 'all') result = result.filter(c => c.segment === segmentFilter);
    result = result.filter(c => c.churnScore * 100 >= churnRange[0] && c.churnScore * 100 <= churnRange[1]);
    result.sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      if (typeof va === 'string') return sortDir === 'asc' ? (va as string).localeCompare(vb as unknown as string) : (vb as unknown as string).localeCompare(va as string);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return result;
  }, [customers, search, riskFilter, segmentFilter, sortKey, sortDir, churnRange]);

  const exportCSV = () => {
    const headers = 'Name,Email,Segment,Churn Score,Risk Level,MRR,CLV,Sentiment\n';
    const rows = filtered.map(c => `${c.name},${c.email},${c.segment},${c.churnScore},${c.riskLevel},${c.mrr},${c.clv},${c.sentimentScore}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />;
  };

  return (
    <PageWrapper title="Customer Matrix" subtitle={`${filtered.length} of ${customers.length} customers`}>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search name, email, segment..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as RiskLevel | 'all')}
          className="px-3 py-2 bg-input border border-border rounded-md text-sm">
          <option value="all">All Risk</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value as Segment | 'all')}
          className="px-3 py-2 bg-input border border-border rounded-md text-sm">
          <option value="all">All Segments</option>
          <option value="Enterprise">Enterprise</option>
          <option value="SMB">SMB</option>
          <option value="Startup">Startup</option>
          <option value="Individual">Individual</option>
        </select>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Churn: {churnRange[0]}%-{churnRange[1]}%</span>
          <input type="range" min={0} max={100} value={churnRange[0]}
            onChange={e => setChurnRange([+e.target.value, churnRange[1]])}
            className="w-20 accent-qci-cyan" />
          <input type="range" min={0} max={100} value={churnRange[1]}
            onChange={e => setChurnRange([churnRange[0], +e.target.value])}
            className="w-20 accent-qci-cyan" />
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:opacity-80 transition-opacity">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {[
                  { key: 'name' as SortKey, label: 'Name' },
                  { key: 'churnScore' as SortKey, label: 'Churn Risk' },
                  { key: 'mrr' as SortKey, label: 'MRR' },
                  { key: 'clv' as SortKey, label: 'CLV' },
                  { key: 'sentimentScore' as SortKey, label: 'Sentiment' },
                  { key: 'daysSinceActivity' as SortKey, label: 'Days Active' },
                  { key: 'quantumConfidence' as SortKey, label: 'Q. Confidence' },
                ].map(col => (
                  <th key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-xs text-muted-foreground font-body font-semibold uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  >
                    {col.label} <SortIcon col={col.key} />
                  </th>
                ))}
                <th className="px-4 py-3 text-xs text-muted-foreground font-body font-semibold uppercase tracking-wider">Strategy</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((c, i) => (
                <motion.tr
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-heading font-bold text-qci-cyan">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.segment}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RiskBadge level={c.riskLevel} />
                      <span className="font-mono text-xs">{Math.round(c.churnScore * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">${c.mrr.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs">${c.clv.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs ${c.sentimentScore > 0 ? 'text-qci-green' : c.sentimentScore < 0 ? 'text-qci-red' : 'text-muted-foreground'}`}>
                      {c.sentimentScore > 0 ? '+' : ''}{c.sentimentScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.daysSinceActivity}d</td>
                  <td className="px-4 py-3 font-mono text-xs">{Math.round(c.quantumConfidence * 100)}%</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.assignedStrategy}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
            Showing 50 of {filtered.length} customers
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Customers;
