export type TransactionType = 'CHURN_PREDICTION' | 'RETENTION_ACTION' | 'PRICING_CHANGE' | 'MODEL_UPDATE' | 'CONSENT_RECORD';

export interface Transaction {
  id: string;
  type: TransactionType;
  data: Record<string, unknown>;
  hash: string;
  timestamp: string;
}

export interface Block {
  index: number;
  timestamp: string;
  previousHash: string;
  hash: string;
  merkleRoot: string;
  transactions: Transaction[];
  nonce: number;
  validator: string;
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
}

export interface ZKProof {
  id: string;
  predictionId: string;
  commitment: string;
  challenge: string;
  response: string;
  publicSignal: boolean;
  valid: boolean;
  generatedAt: string;
  verificationTimeMs: number;
}

export interface SmartContractEvent {
  id: string;
  contractName: string;
  action: string;
  customerId: string;
  customerName: string;
  triggerCondition: string;
  status: 'executed' | 'pending' | 'failed';
  timestamp: string;
  blockIndex: number;
}
