// src/components/Layout.tsx
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-container">
      <header>
        <h1>Ledger Polkadot多簽錢包</h1>
        <p className="subtitle">專為Ledger硬件錢包設計的Polkadot多簽解決方案</p>
      </header>

      {children}

      <footer>
        <p>© {new Date().getFullYear()} Ledger Polkadot多簽錢包</p>
        <p className="note">此應用程序僅與Ledger硬件錢包配合使用，確保最高的安全性</p>
      </footer>
    </div>
  );
};

export default Layout;
