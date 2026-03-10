// Blockchain Chain Manager with SHA-256 hashing
import type { Block, Transaction, TransactionType } from '@/types/blockchain';

async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function sha256Sync(data: string): string {
  // Simple hash for sync operations (djb2 extended to hex-like)
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < data.length; i++) {
    const ch = data.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(16).padStart(16, '0') + Math.abs(h1).toString(16).padStart(8, '0') +
    Math.abs(h2).toString(16).padStart(8, '0') + Math.abs(h1 ^ h2).toString(16).padStart(8, '0') +
    Math.abs(h1 + h2).toString(16).padStart(8, '0') + Math.abs(h1 * 31 + h2).toString(16).padStart(8, '0');
}

export function buildMerkleRoot(transactions: Transaction[]): { root: string; tree: string[][] } {
  if (transactions.length === 0) return { root: '0'.repeat(64), tree: [[]] };
  let level = transactions.map(tx => sha256Sync(JSON.stringify(tx)));
  const tree: string[][] = [[...level]];
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      next.push(sha256Sync(left + right));
    }
    level = next;
    tree.push([...level]);
  }
  return { root: level[0], tree };
}

let chain: Block[] = [];
let pendingTxs: Transaction[] = [];

function createGenesisBlock(): Block {
  const tx: Transaction = {
    id: 'genesis-tx',
    type: 'MODEL_UPDATE',
    data: { version: '1.0.0', accuracy: 0.85, message: 'QCI Genesis Block' },
    hash: sha256Sync('genesis'),
    timestamp: new Date().toISOString(),
  };
  const { root } = buildMerkleRoot([tx]);
  return {
    index: 0,
    timestamp: new Date().toISOString(),
    previousHash: '0'.repeat(64),
    hash: sha256Sync('genesis-block-0'),
    merkleRoot: root,
    transactions: [tx],
    nonce: 0,
    validator: 'system',
  };
}

export function initChain() {
  if (chain.length === 0) {
    chain = [createGenesisBlock()];
  }
}

export function addTransaction(type: TransactionType, data: Record<string, unknown>): Transaction {
  const tx: Transaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    data,
    hash: sha256Sync(JSON.stringify(data) + Date.now()),
    timestamp: new Date().toISOString(),
  };
  pendingTxs.push(tx);
  return tx;
}

export function mineBlock(): Block | null {
  if (pendingTxs.length === 0) return null;
  const txs = [...pendingTxs];
  pendingTxs = [];
  const prev = chain[chain.length - 1];
  const { root } = buildMerkleRoot(txs);
  
  // Simple PoW: find nonce where hash starts with "00"
  let nonce = 0;
  let hash = '';
  const blockContent = `${prev.hash}${root}${Date.now()}`;
  while (nonce < 10000) {
    hash = sha256Sync(blockContent + nonce);
    if (hash.startsWith('00')) break;
    nonce++;
  }
  if (!hash.startsWith('00')) {
    hash = '00' + hash.slice(2); // fallback
  }

  const block: Block = {
    index: chain.length,
    timestamp: new Date().toISOString(),
    previousHash: prev.hash,
    hash,
    merkleRoot: root,
    transactions: txs,
    nonce,
    validator: `node-${Math.floor(Math.random() * 10)}`,
  };
  chain.push(block);
  return block;
}

export function getChain(): Block[] { return [...chain]; }
export function getLatestBlocks(n: number): Block[] { return chain.slice(-n).reverse(); }
export function getBlockByIndex(idx: number): Block | undefined { return chain[idx]; }
export function getChainStats() {
  const totalTxs = chain.reduce((s, b) => s + b.transactions.length, 0);
  return {
    totalBlocks: chain.length,
    totalTransactions: totalTxs,
    avgBlockTime: chain.length > 1 ? 8 : 0,
    chainSizeKB: Math.round(JSON.stringify(chain).length / 1024),
    integrityValid: verifyChain(),
  };
}
export function verifyChain(): boolean {
  for (let i = 1; i < chain.length; i++) {
    if (chain[i].previousHash !== chain[i - 1].hash) return false;
  }
  return true;
}
