// src/components/LedgerConnect.ts
import ledgerService from '../utils/ledger';
import { LedgerAccount } from '../utils/types';

class LedgerConnect {
  private domElement: HTMLElement;
  private addresses: LedgerAccount[] = [];

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.domElement.innerHTML = `
      <div class="ledger-section">
        <h2>連接Ledger設備</h2>
        <div class="info-text">請確保您的Ledger設備已連接並打開Polkadot應用</div>
        <div class="button-group">
          <button id="connect-ledger" class="primary-button">連接Ledger</button>
          <button id="get-addresses" class="secondary-button" disabled>獲取地址</button>
        </div>
        <div id="status-message" class="status"></div>
        <div id="addresses-container" class="addresses-list"></div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const connectBtn = this.domElement.querySelector('#connect-ledger') as HTMLButtonElement;
    const getAddressesBtn = this.domElement.querySelector('#get-addresses') as HTMLButtonElement;

    if (!connectBtn || !getAddressesBtn) {
      console.error("Button elements not found");
      return;
    }

    // 連接Ledger
    connectBtn.addEventListener('click', async () => {
      this.updateStatus('正在連接Ledger設備...');
      try {
        if (!ledgerService.isSupported()) {
          throw new Error('您的瀏覽器不支持WebHID，請使用Chrome或Edge瀏覽器');
        }

        await ledgerService.connect();
        this.updateStatus('Ledger設備已連接!', 'success');
        getAddressesBtn.disabled = false;
      } catch (error) {
        this.updateStatus(`連接錯誤: ${(error as Error).message}`, 'error');
      }
    });

    // 獲取地址
    getAddressesBtn.addEventListener('click', async () => {
      this.updateStatus('正在從Ledger獲取地址...');
      try {
        this.addresses = [];
        const addressesContainer = this.domElement.querySelector('#addresses-container');

        if (!addressesContainer) {
          throw new Error("Addresses container not found");
        }

        addressesContainer.innerHTML = '';

        // 獲取5個帳戶地址
        for (let i = 0; i < 5; i++) {
          const account = await ledgerService.getAddress(i);
          this.addresses.push(account);

          const addressElement = document.createElement('div');
          addressElement.className = 'address-item';
          addressElement.innerHTML = `
            <input type="checkbox" id="addr-${i}" data-index="${i}">
            <label for="addr-${i}">帳戶 ${i}: ${account.address}</label>
          `;
          addressesContainer.appendChild(addressElement);
        }

        this.updateStatus('成功獲取地址', 'success');

        // 發出地址已載入事件
        const event = new CustomEvent('ledger-addresses-loaded', {
          detail: { addresses: this.addresses }
        });
        document.dispatchEvent(event);
      } catch (error) {
        this.updateStatus(`獲取地址錯誤: ${(error as Error).message}`, 'error');
      }
    });
  }

  // 更新狀態訊息
  private updateStatus(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    const statusElement = this.domElement.querySelector('#status-message');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
  }

  // 獲取選擇的地址
  public getSelectedAddresses(): LedgerAccount[] {
    const selected: LedgerAccount[] = [];
    const checkboxes = this.domElement.querySelectorAll('input[type="checkbox"]:checked');

    checkboxes.forEach(checkbox => {
      const index = parseInt((checkbox as HTMLInputElement).dataset.index || '0');
      if (this.addresses[index]) {
        selected.push(this.addresses[index]);
      }
    });

    return selected;
  }
}

export default LedgerConnect;
