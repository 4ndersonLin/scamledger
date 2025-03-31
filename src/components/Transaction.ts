// src/components/Transaction.ts
import polkadotService from '../utils/polkadot';
import { LedgerAccount, MultisigInfo, Timepoint } from '../utils/types';

class Transaction {
  private domElement: HTMLElement;
  private multisigInfo: MultisigInfo | null = null;
  private ledgerAccounts: LedgerAccount[] = [];

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;

    this.render();
    this.attachEventListeners();

    // 監聽多簽地址創建事件
    document.addEventListener('multisig-created', ((event: CustomEvent) => {
      this.multisigInfo = event.detail.multisigInfo;
      this.updateMultisigInfo();
    }) as EventListener);

    // 監聽Ledger地址載入事件
    document.addEventListener('ledger-addresses-loaded', ((event: CustomEvent) => {
      this.ledgerAccounts = event.detail.addresses;
      this.updateSignerOptions();
    }) as EventListener);
  }

  private render(): void {
    this.domElement.innerHTML = `
      <div class="transaction-section">
        <h2>多簽交易</h2>
        
        <div id="multisig-info" class="info-panel">
          <div class="empty-state">請先創建多簽地址</div>
        </div>
        
        <div class="tabs">
          <button class="tab-button active" data-tab="initiate">發起交易</button>
          <button class="tab-button" data-tab="approve">批准交易</button>
        </div>
        
        <div class="tab-content" id="initiate-tab">
          <div class="form-group">
            <label>發送者帳戶:</label>
            <select id="sender-select"></select>
          </div>
          
          <div class="form-group">
            <label>接收地址:</label>
            <input type="text" id="recipient-address" placeholder="輸入SS58地址">
          </div>
          
          <div class="form-group">
            <label>金額 (單位: Planck):</label>
            <input type="number" id="amount" min="1" step="1">
            <div class="helper-text">1 DOT = 10,000,000,000 Planck</div>
          </div>
          
          <button id="initiate-transaction" class="primary-button">發起交易</button>
          
          <div id="initiate-result" class="result-container"></div>
        </div>
        
        <div class="tab-content hidden" id="approve-tab">
          <div class="form-group">
            <label>批准者帳戶:</label>
            <select id="approver-select"></select>
          </div>
          
          <div class="form-group">
            <label>Call Hash:</label>
            <input type="text" id="call-hash" placeholder="輸入Call Hash">
          </div>
          
          <div class="form-group">
            <label>區塊高度:</label>
            <input type="number" id="block-height" min="0">
          </div>
          
          <div class="form-group">
            <label>交易索引:</label>
            <input type="number" id="tx-index" min="0">
          </div>
          
          <button id="approve-transaction" class="primary-button">批准交易</button>
          
          <div id="approve-result" class="result-container"></div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // 切換頁籤
    const tabButtons = this.domElement.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // 移除所有活動頁籤
        tabButtons.forEach(btn => btn.classList.remove('active'));

        // 隱藏所有頁籤內容
        const tabContents = this.domElement.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.add('hidden'));

        // 激活選擇的頁籤
        button.classList.add('active');
        const tabId = (button as HTMLElement).dataset.tab + '-tab';
        const selectedTab = this.domElement.querySelector(`#${tabId}`);
        if (selectedTab) {
          selectedTab.classList.remove('hidden');
        }
      });
    });

    // 發起交易按鈕
    const initiateBtn = this.domElement.querySelector('#initiate-transaction');
    if (initiateBtn) {
      initiateBtn.addEventListener('click', async () => {
        try {
          // 檢查是否有多簽信息
          if (!this.multisigInfo) {
            throw new Error('請先創建多簽地址');
          }

          const resultContainer = this.domElement.querySelector('#initiate-result');
          if (resultContainer) {
            resultContainer.innerHTML = '<div class="info">處理中...</div>';
          }

          // 獲取發送者帳戶索引
          const senderSelect = this.domElement.querySelector('#sender-select') as HTMLSelectElement;
          const senderIndex = parseInt(senderSelect?.value || '0');

          // 獲取接收地址和金額
          const recipientAddressInput = this.domElement.querySelector('#recipient-address') as HTMLInputElement;
          const amountInput = this.domElement.querySelector('#amount') as HTMLInputElement;

          const recipientAddress = recipientAddressInput?.value.trim() || '';
          const amount = amountInput?.value.trim() || '';

          if (!recipientAddress) {
            throw new Error('請輸入接收地址');
          }

          if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            throw new Error('請輸入有效金額');
          }

          // 創建轉賬交易
          const transferTx = await polkadotService.createTransferTransaction(
            recipientAddress,
            amount
          );

          // 發起多簽交易
          const result = await polkadotService.initiateMultisigTransaction(
            this.multisigInfo,
            transferTx,
            senderIndex
          );

          // 顯示結果
          if (resultContainer) {
            resultContainer.innerHTML = `
              <h3>交易已發起</h3>
              <div class="info-row">
                <span class="label">交易Hash:</span>
                <span class="value">${result.txHash}</span>
              </div>
              <div class="info-row">
                <span class="label">發送者:</span>
                <span class="value">${result.sender}</span>
              </div>
              <div class="info-row">
                <span class="label">多簽地址:</span>
                <span class="value">${result.multisigAddress}</span>
              </div>
              <div class="success-message">
                交易已成功發起，等待其他簽名者批准。
              </div>
            `;
          }
        } catch (error) {
          const resultContainer = this.domElement.querySelector('#initiate-result');
          if (resultContainer) {
            resultContainer.innerHTML = `<div class="error">錯誤: ${(error as Error).message}</div>`;
          }
        }
      });
    }

    // 批准交易按鈕
    const approveBtn = this.domElement.querySelector('#approve-transaction');
    if (approveBtn) {
      approveBtn.addEventListener('click', async () => {
        try {
          // 檢查是否有多簽信息
          if (!this.multisigInfo) {
            throw new Error('請先創建多簽地址');
          }

          const resultContainer = this.domElement.querySelector('#approve-result');
          if (resultContainer) {
            resultContainer.innerHTML = '<div class="info">處理中...</div>';
          }

          // 獲取批准者帳戶索引
          const approverSelect = this.domElement.querySelector('#approver-select') as HTMLSelectElement;
          const approverIndex = parseInt(approverSelect?.value || '0');

          // 獲取Call Hash和時間點信息
          const callHashInput = this.domElement.querySelector('#call-hash') as HTMLInputElement;
          const blockHeightInput = this.domElement.querySelector('#block-height') as HTMLInputElement;
          const txIndexInput = this.domElement.querySelector('#tx-index') as HTMLInputElement;

          const callHash = callHashInput?.value.trim() || '';
          const blockHeight = blockHeightInput?.value.trim() || '';
          const txIndex = txIndexInput?.value.trim() || '';

          if (!callHash) {
            throw new Error('請輸入Call Hash');
          }

          if (!blockHeight || isNaN(Number(blockHeight))) {
            throw new Error('請輸入有效的區塊高度');
          }

          if (!txIndex || isNaN(Number(txIndex))) {
            throw new Error('請輸入有效的交易索引');
          }

          // 創建時間點對象
          const timepoint: Timepoint = {
            height: parseInt(blockHeight),
            index: parseInt(txIndex)
          };

          // 批准多簽交易
          const result = await polkadotService.approveMultisigTransaction(
            this.multisigInfo,
            callHash,
            timepoint,
            approverIndex
          );

          // 顯示結果
          if (resultContainer) {
            resultContainer.innerHTML = `
              <h3>交易已批准</h3>
              <div class="info-row">
                <span class="label">交易Hash:</span>
                <span class="value">${result.txHash}</span>
              </div>
              <div class="info-row">
                <span class="label">批准者:</span>
                <span class="value">${result.sender}</span>
              </div>
              <div class="info-row">
                <span class="label">多簽地址:</span>
                <span class="value">${result.multisigAddress}</span>
              </div>
              <div class="success-message">
                批准交易成功。如果達到了門檻值，交易將被執行。
              </div>
            `;
          }
        } catch (error) {
          const resultContainer = this.domElement.querySelector('#approve-result');
          if (resultContainer) {
            resultContainer.innerHTML = `<div class="error">錯誤: ${(error as Error).message}</div>`;
          }
        }
      });
    }
  }

  // 更新多簽信息
  private updateMultisigInfo(): void {
    const infoPanel = this.domElement.querySelector('#multisig-info');
    if (!infoPanel) return;

    if (this.multisigInfo) {
      infoPanel.innerHTML = `
        <div class="info-row">
          <span class="label">多簽地址:</span>
          <span class="value">${this.multisigInfo.multisigAddress}</span>
        </div>
        <div class="info-row">
          <span class="label">簽名者數量:</span>
          <span class="value">${this.multisigInfo.signatories.length}</span>
        </div>
        <div class="info-row">
          <span class="label">門檻值:</span>
          <span class="value">${this.multisigInfo.threshold}</span>
        </div>
      `;

      // 獲取餘額
      this.fetchAndDisplayBalance();
    } else {
      infoPanel.innerHTML = `<div class="empty-state">請先創建多簽地址</div>`;
    }
  }

  // 更新簽名者選項
  private updateSignerOptions(): void {
    const senderSelect = this.domElement.querySelector('#sender-select') as HTMLSelectElement;
    const approverSelect = this.domElement.querySelector('#approver-select') as HTMLSelectElement;

    if (!senderSelect || !approverSelect) return;

    // 清空現有選項
    senderSelect.innerHTML = '';
    approverSelect.innerHTML = '';

    // 添加新選項
    this.ledgerAccounts.forEach((account, index) => {
      const senderOption = document.createElement('option');
      senderOption.value = index.toString();
      senderOption.textContent = `帳戶 ${index}: ${account.address}`;
      senderSelect.appendChild(senderOption);

      const approverOption = document.createElement('option');
      approverOption.value = index.toString();
      approverOption.textContent = `帳戶 ${index}: ${account.address}`;
      approverSelect.appendChild(approverOption);
    });
  }

  // 獲取並顯示多簽地址的餘額
  private async fetchAndDisplayBalance(): Promise<void> {
    if (!this.multisigInfo) return;

    try {
      const balance = await polkadotService.getBalance(this.multisigInfo.multisigAddress);

      const infoPanel = this.domElement.querySelector('#multisig-info');
      if (!infoPanel) return;

      // 添加餘額信息
      const balanceElement = document.createElement('div');
      balanceElement.className = 'info-row balance';
      balanceElement.innerHTML = `
        <span class="label">餘額:</span>
        <span class="value">${this.formatBalance(balance.total)} DOT</span>
      `;

      infoPanel.appendChild(balanceElement);
    } catch (error) {
      console.error('獲取餘額失敗:', error);
    }
  }

  // 格式化餘額顯示
  private formatBalance(planck: string): string {
    const dot = Number(planck) / 10000000000;
    return dot.toFixed(4);
  }
}

export default Transaction;
