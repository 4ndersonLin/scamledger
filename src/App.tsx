// src/App.tsx
import React, { useState } from 'react';
import LedgerConnect from './components/LedgerConnect';
import MultisigCreate from './components/MultisigCreate';
import Transaction from './components/Transaction';
import Layout from './components/Layout';
import { LedgerAccount, MultisigInfo } from './utils/types';

const App: React.FC = () => {
  // 狀態管理
  const [ledgerAddresses, setLedgerAddresses] = useState<LedgerAccount[]>([]);
  const [multisigInfo, setMultisigInfo] = useState<MultisigInfo | null>(null);

  // 處理Ledger地址載入
  const handleLedgerAddressesLoaded = (addresses: LedgerAccount[]) => {
    setLedgerAddresses(addresses);
  };

  // 處理多簽地址創建
  const handleMultisigCreated = (info: MultisigInfo) => {
    setMultisigInfo(info);
  };

  return (
    <Layout>
      {/* Ledger連接部分 */}
      <section className="section">
        <LedgerConnect onAddressesLoaded={handleLedgerAddressesLoaded} />
      </section>

      {/* 多簽創建部分 */}
      <section className="section">
        <MultisigCreate
          ledgerAddresses={ledgerAddresses}
          onMultisigCreated={handleMultisigCreated}
        />
      </section>

      {/* 交易部分 */}
      <section className="section">
        <Transaction
          ledgerAccounts={ledgerAddresses}
          multisigInfo={multisigInfo}
        />
      </section>
    </Layout>
  );
};

export default App;
