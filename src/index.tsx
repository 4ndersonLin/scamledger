// src/index.ts
import './style.css';
import LedgerConnect from './components/LedgerConnect';
import MultisigCreate from './components/MultisigCreate';
import Transaction from './components/Transaction';

// 確保DOM已加載
document.addEventListener('DOMContentLoaded', () => {
  // 創建應用容器
  const app = document.createElement('div');
  app.className = 'app-container';
  document.body.appendChild(app);

  // 標題
  const header = document.createElement('header');
  header.innerHTML = `
    <h1>Ledger Polkadot多簽錢包</h1>
    <p class="subtitle">專為Ledger硬件錢包設計的Polkadot多簽解決方案</p>
  `;
  app.appendChild(header);

  // 創建組件容器
  const ledgerSection = document.createElement('section');
  const multisigSection = document.createElement('section');
  const transactionSection = document.createElement('section');

  app.appendChild(ledgerSection);
  app.appendChild(multisigSection);
  app.appendChild(transactionSection);

  // 初始化組件
  new LedgerConnect(ledgerSection);
  new MultisigCreate(multisigSection);
  new Transaction(transactionSection);

  // 添加頁腳
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <p>© ${new Date().getFullYear()} Ledger Polkadot多簽錢包</p>
    <p class="note">此應用程序僅與Ledger硬件錢包配合使用，確保最高的安全性</p>
  `;
  app.appendChild(footer);
});
