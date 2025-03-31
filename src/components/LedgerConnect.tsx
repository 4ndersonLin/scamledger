// src/components/LedgerConnect.tsx
import React, { useState } from 'react';
import ledgerService from '../utils/ledger';
import { LedgerAccount } from '../utils/types';

interface LedgerConnectProps {
  onAddressesLoaded: (addresses: LedgerAccount[]) => void;
}

const LedgerConnect: React.FC<LedgerConnectProps> = ({ onAddressesLoaded }) => {
  const [status, setStatus] = useState<{ message: string, type: 'info' | 'success' | 'error' }>({
    message: '準備連接Ledger設備',
    type: 'info'
  });
  const [addresses, setAddresses] = useState<LedgerAccount[]>([]);
  const [selectedAddresses, setSelectedAddresses] = useState<number[]>([]);

  // 連接Ledger設備
  const connectLedger = async () => {
    setStatus({ message: '正在連接Ledger設備...', type: 'info' });
    try {
      if (!ledgerService.isSupported()) {
        throw new Error('您的瀏覽器不支持WebHID，請使用Chrome或Edge瀏覽器');
      }

      await ledgerService.connect();
      setStatus({ message: 'Ledger設備已連接!', type: 'success' });
    } catch (error) {
      setStatus({ message: `連接錯誤: ${(error as Error).message}`, type: 'error' });
    }
  };

  // 獲取Ledger地址
  const getAddresses = async () => {
    setStatus({ message: '正在從Ledger獲取地址...', type: 'info' });
    try {
      const fetchedAddresses: LedgerAccount[] = [];

      // 獲取5個帳戶地址
      for (let i = 0; i < 5; i++) {
        const account = await ledgerService.getAddress(i);
        fetchedAddresses.push(account);
      }

      setAddresses(fetchedAddresses);
      setStatus({ message: '成功獲取地址', type: 'success' });

      // 通知父組件地址已加載
      onAddressesLoaded(fetchedAddresses);
    } catch (error) {
      setStatus({ message: `獲取地址錯誤: ${(error as Error).message}`, type: 'error' });
    }
  };

  // 處理地址選擇變更
  const handleAddressCheckChange = (index: number) => {
    setSelectedAddresses(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  return (
    <div className="ledger-section">
      <h2>連接Ledger設備</h2>
      <div className="info-text">請確保您的Ledger設備已連接並打開Polkadot應用</div>

      <div className="button-group">
        <button
          className="primary-button"
          onClick={connectLedger}
        >
          連接Ledger
        </button>

        <button
          className="secondary-button"
          onClick={getAddresses}
          disabled={status.type !== 'success'}
        >
          獲取地址
        </button>
      </div>

      <div className={`status ${status.type}`}>
        {status.message}
      </div>

      {addresses.length > 0 && (
        <div className="addresses-list">
          {addresses.map((account, idx) => (
            <div className="address-item" key={idx}>
              <input
                type="checkbox"
                id={`addr-${idx}`}
                checked={selectedAddresses.includes(idx)}
                onChange={() => handleAddressCheckChange(idx)}
              />
              <label htmlFor={`addr-${idx}`}>帳戶 {idx}: {account.address}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LedgerConnect;
