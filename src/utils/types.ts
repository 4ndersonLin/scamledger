// src/utils/types.ts

// Ledger相關類型
export interface LedgerAccount {
  address: string;
  pubKey: string;
  index: number;
}

// 多簽相關類型
export interface MultisigInfo {
  multisigAddress: string;
  signatories: string[];
  threshold: number;
}

// 交易相關類型
export interface TransactionResult {
  txHash: string;
  sender: string;
  multisigAddress: string;
}

export interface BalanceInfo {
  free: string;
  reserved: string;
  total: string;
}

export interface Timepoint {
  height: number;
  index: number;
}
