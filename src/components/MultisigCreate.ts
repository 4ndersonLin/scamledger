// src/components/MultisigCreate.ts
import polkadotService from '../utils/polkadot';
import { LedgerAccount, MultisigInfo } from '../utils/types';

class MultisigCreate {
  private domElement: HTMLElement;
  private ledgerAddresses: LedgerAccount[] = [];
  private multisigInfo: MultisigInfo | null = null;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;

    this.render();
    this.attachEventListeners();

    // 監聽Ledger地址載入事件
    document.addEventListener('ledger-addresses-loaded', ((event: CustomEvent) => {
      this.ledgerAddresses = event.detail.addresses;
      this.updateLedgerAddressOptions();
    }) as EventListener);
  }

  private render(): void {
    this.domElement.innerHTML = `
      <div class="multisig-section">
        <h2>創建多簽地址</h2>
        <div class="form-group">
          <label>網絡:</label>
          <select id="network-select">
            <option value="polkadot">Polkadot</option>
            <option value="kusama">Kusama</option>
            <option value="westend">Westend</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Ledger簽名者:</label>
          <select id="ledger-signers" multiple></select>
          <div class="helper-text">按住Ctrl鍵可選擇多個地址</div>
        </div>
        
        <div class="form-group">
          <label>外部簽名者地址:</label>
          <div id="external-signers-container">
            <div class="external-signer">
              <input type="text" class="external-signer-input" placeholder="輸入SS58地址">
              <button class="remove-signer">移除</button>
            </div>
          </div>
          <button id="add-external-signer" class="secondary-button">添加外部簽名者</button>
        </div>
        
        <div class="form-group">
          <label>門檻值 (需要的簽名數):</label>
          <input type="number" id="threshold" min="2" value="2">
        </div>
        
        <button id="create-multisig" class="primary-button">創建多簽地址</button>
        
        <div id="multisig-result" class="result-container"></div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const addExternalSignerBtn = this.domElement.querySelector('#add-external-signer');
    const createMultisigBtn = this.domElement.querySelector('#create-multisig');
    const externalSignersContainer = this.domElement.querySelector('#external-signers-container');

    if (!addExternalSignerBtn || !createMultisigBtn || !externalSignersContainer) {
      console.error("Required elements not found");
      return;
    }

    // 添加外部簽名者
    addExternalSignerBtn.addEventListener('click', () => {
      const signerElement = document.createElement('div');
      signerElement.className = 'external-signer';
      signerElement.innerHTML = `
        <input type="text" class="external-signer-input" placeholder="輸入SS58地址">
        <button class="remove-signer">移除</button>
      `;
      externalSignersContainer.appendChild(signerElement);

      // 綁定移除按鈕
      const removeBtn = signerElement.querySelector('.remove-signer');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          externalSignersContainer.removeChild(signerElement);
        });
      }
    });

    // 創建多簽地址
    createMultisigBtn.addEventListener('click', async () => {
      try {
        // 獲取選擇的網絡
        const networkSelect = this.domElement.querySelector('#network-select') as HTMLSelectElement;
        const network = networkSelect?.value || 'polkadot';

        // 連接到選擇的網絡
        await polkadotService.connect(network);

        // 獲取Ledger簽名者
        const ledgerSignersSelect = this.domElement.querySelector('#ledger-signers') as HTMLSelectElement;
        const selectedLedgerOptions = Array.from(ledgerSignersSelect?.selectedOptions || []);
        const ledgerSigners = selectedLedgerOptions.map(option => {
          const index = parseInt(option.value);
          return this.ledgerAddresses[index].address;
        });

        // 獲取外部簽名者
        const externalSignerInputs = this.domElement.querySelectorAll('.external-signer-input');
        const externalSigners = Array.from(externalSignerInputs)
          .map(input => (input as HTMLInputElement).value.trim())
          .filter(address => address !== '');

        // 合併所有簽名者
        const allSigners = [...ledgerSigners, ...externalSigners];

        // 獲取門檻值
        const thresholdInput = this.domElement.querySelector('#threshold') as HTMLInputElement;
        const threshold = parseInt(thresholdInput?.value || '2');

        // 驗證輸入
        if (allSigners.length < threshold) {
          throw new Error('簽名者數量必須大於或等於門檻值');
        }

        if (allSigners.length < 2) {
          throw new Error('多簽至少需要2個簽名者');
        }

        // 創建多簽地址
        this.multisigInfo = polkadotService.createMultisigAddress(allSigners, threshold);

        // 顯示結果
        const resultContainer = this.domElement.querySelector('#multisig-result');
        if (resultContainer) {
          resultContainer.innerHTML = `
            <h3>多簽地址已創建</h3>
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
            <div class="info-row">
              <span class="label">網絡:</span>
              <span class="value">${network}</span>
            </div>
          `;
        }

        // 發出多簽地址創建事件
        const event = new CustomEvent('multisig-created', {
          detail: { multisigInfo: this.multisigInfo }
        });
        document.dispatchEvent(event);
      } catch (error) {
        const resultContainer = this.domElement.querySelector('#multisig-result');
        if (resultContainer) {
          resultContainer.innerHTML = `<div class="error">錯誤: ${(error as Error).message}</div>`;
        }
      }
    });

    // 處理外部簽名者的移除按鈕
    this.domElement.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('remove-signer')) {
        const signerElement = target.closest('.external-signer');
        if (signerElement && externalSignersContainer.contains(signerElement)) {
          externalSignersContainer.removeChild(signerElement);
        }
      }
    });
  }

  // 更新Ledger地址選項
  private updateLedgerAddressOptions(): void {
    const ledgerSignersSelect = this.domElement.querySelector('#ledger-signers') as HTMLSelectElement;
    if (!ledgerSignersSelect) return;

    ledgerSignersSelect.innerHTML = '';

    this.ledgerAddresses.forEach((address, index) => {
      const option = document.createElement('option');
      option.value = index.toString();
      option.textContent = `帳戶 ${index}: ${address.address}`;
      ledgerSignersSelect.appendChild(option);
    });
  }
}

export default MultisigCreate;
