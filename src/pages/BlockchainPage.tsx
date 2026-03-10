import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Copy } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import GlowCard from '@/components/shared/GlowCard';
import { useQCIStore } from '@/store/qciStore';
import { getChainStats, buildMerkleRoot } from '@/engine/ChainManager';
import { verifyZKProof } from '@/engine/ZKProofEngine';
import type { Block } from '@/types/blockchain';

const BlockchainPage: React.FC = () => {
  const blocks = useQCIStore(s => s.blocks);
  const zkProofs = useQCIStore(s => s.zkProofs);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [selectedMerkleBlock, setSelectedMerkleBlock] = useState<Block | null>(null);
  const [proofInput, setProofInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; timeMs: number } | null>(null);

  const stats = getChainStats();

  const handleVerifyProof = () => {
    try {
      const proof = JSON.parse(proofInput);
      const result = verifyZKProof(proof);
      setVerifyResult(result);
    } catch {
      setVerifyResult({ valid: false, timeMs: 0 });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <PageWrapper title="Blockchain Ledger" subtitle="Immutable audit trail with cryptographic verification">
      {/* Chain Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Blocks', value: stats.totalBlocks },
          { label: 'Total Transactions', value: stats.totalTransactions },
          { label: 'Avg Block Time', value: `${stats.avgBlockTime}s` },
          { label: 'Chain Size', value: `${stats.chainSizeKB} KB` },
          { label: 'Integrity', value: stats.integrityValid ? '✓ Valid' : '✗ Invalid' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-mono font-bold text-sm mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Block Explorer */}
        <GlowCard color="gold" className="col-span-1">
          <h3 className="text-sm font-heading font-semibold mb-3">Block Explorer</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
            {[...blocks].reverse().map(block => (
              <div key={block.index} className="border border-border/50 rounded overflow-hidden">
                <button
                  onClick={() => {
                    setExpandedBlock(expandedBlock === block.index ? null : block.index);
                    setSelectedMerkleBlock(block);
                  }}
                  className="w-full flex items-center gap-2 p-3 hover:bg-secondary/30 transition-colors text-left"
                >
                  {expandedBlock === block.index ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="text-xs font-mono text-qci-gold">#{block.index}</span>
                  <span className="text-xs font-mono text-muted-foreground truncate flex-1">{block.hash.slice(0, 20)}...</span>
                  <span className="text-xs text-muted-foreground">{block.transactions.length} txs</span>
                </button>
                <AnimatePresence>
                  {expandedBlock === block.index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 overflow-hidden"
                    >
                      <div className="p-3 text-xs space-y-1">
                        <div className="flex justify-between"><span className="text-muted-foreground">Hash:</span><span className="font-mono truncate ml-2">{block.hash}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Prev:</span><span className="font-mono truncate ml-2">{block.previousHash.slice(0, 24)}...</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Merkle:</span><span className="font-mono truncate ml-2">{block.merkleRoot.slice(0, 24)}...</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Nonce:</span><span className="font-mono">{block.nonce}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Validator:</span><span className="font-mono">{block.validator}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Time:</span><span className="font-mono">{new Date(block.timestamp).toLocaleString()}</span></div>
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-muted-foreground mb-1">Transactions:</p>
                          {block.transactions.map(tx => (
                            <div key={tx.id} className="py-1 pl-2 border-l-2 border-qci-gold/30 mb-1">
                              <span className="text-qci-gold">{tx.type}</span>
                              <span className="text-muted-foreground ml-2 font-mono">{tx.hash.slice(0, 16)}...</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Merkle Tree Visualization */}
        <GlowCard color="cyan">
          <h3 className="text-sm font-heading font-semibold mb-3">Merkle Tree</h3>
          {selectedMerkleBlock ? (
            <div className="overflow-x-auto">
              {(() => {
                const { tree } = buildMerkleRoot(selectedMerkleBlock.transactions);
                return (
                  <div className="flex flex-col items-center gap-3 py-4">
                    {[...tree].reverse().map((level, li) => (
                      <div key={li} className="flex gap-2 flex-wrap justify-center">
                        {level.map((hash, hi) => (
                          <div key={hi} className={`px-2 py-1 rounded text-xs font-mono truncate max-w-[100px] border ${li === 0 ? 'border-qci-cyan bg-qci-cyan/10 text-qci-cyan' : 'border-border/50 text-muted-foreground'}`}>
                            {hash.slice(0, 8)}...
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
              <p className="text-xs text-muted-foreground text-center">Block #{selectedMerkleBlock.index} — Root: {selectedMerkleBlock.merkleRoot.slice(0, 16)}...</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-12">Select a block to view its Merkle tree</p>
          )}
        </GlowCard>
      </div>

      {/* ZK Proof Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlowCard color="purple">
          <h3 className="text-sm font-heading font-semibold mb-3">ZK Proof Inspector</h3>
          <textarea
            value={proofInput}
            onChange={e => setProofInput(e.target.value)}
            placeholder="Paste ZK proof JSON to verify..."
            className="w-full h-32 bg-background/50 border border-border rounded p-3 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-3 mt-2">
            <button onClick={handleVerifyProof}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:opacity-90">
              Verify Proof
            </button>
            {verifyResult && (
              <div className={`flex items-center gap-1 text-xs ${verifyResult.valid ? 'text-qci-green' : 'text-qci-red'}`}>
                {verifyResult.valid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {verifyResult.valid ? 'Valid' : 'Invalid'} ({verifyResult.timeMs}ms)
              </div>
            )}
          </div>
        </GlowCard>

        <GlowCard color="gold">
          <h3 className="text-sm font-heading font-semibold mb-3">Recent ZK Proofs</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {zkProofs.slice(-10).reverse().map(proof => (
              <div key={proof.id} className="p-2 bg-background/50 rounded border border-border/50 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-qci-purple">{proof.id.slice(0, 16)}</span>
                  <button onClick={() => copyToClipboard(JSON.stringify(proof, null, 2))}
                    className="p-1 hover:bg-secondary rounded"><Copy className="w-3 h-3" /></button>
                </div>
                <div className="flex gap-3">
                  <span className={proof.valid ? 'text-qci-green' : 'text-qci-red'}>{proof.valid ? '✓ Valid' : '✗ Invalid'}</span>
                  <span className="text-muted-foreground">{proof.verificationTimeMs}ms</span>
                  <span className="text-muted-foreground">Signal: {proof.publicSignal ? 'High Risk' : 'Low Risk'}</span>
                </div>
              </div>
            ))}
            {zkProofs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No proofs generated yet</p>}
          </div>
        </GlowCard>
      </div>
    </PageWrapper>
  );
};

export default BlockchainPage;
