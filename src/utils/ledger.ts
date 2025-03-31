// src/utils/ledger.ts
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import { listen } from "@ledgerhq/logs";
import { LedgerAccount } from "./types";

class LedgerService {
  private transport: TransportWebHID | null = null;
  private app: Polkadot | null = null;
  private connected: boolean = false;

  constructor() {
    // 啟用Ledger日誌
    listen(log => console.log(`[Ledger] ${log.type}: ${log.message}`));
  }

  // 檢查是否支援WebHID
  public isSupported(): boolean {
    return !!navigator.hid;
  }

  // 連接到Ledger設備
  public async connect(): Promise<boolean> {
    if (this.connected) return true;

    try {
      // 創建WebHID傳輸
      this.transport = await TransportWebHID.create();

      // 創建Polkadot應用實例
      this.app = new Polkadot(this.transport);

      // 測試連接 - 獲取版本信息
      const version = await this.app.getVersion();
      console.log(`Ledger Polkadot app version: ${version.major}.${version.minor}.${version.patch}`);

      this.connected = true;
      return true;
    } catch (error) {
      console.error("Ledger連接失敗:", error);
      this.connected = false;
      throw error;
    }
  }

  // 獲取Ledger上的Polkadot地址
  public async getAddress(accountIndex: number = 0): Promise<LedgerAccount> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.app) {
      throw new Error("Ledger應用未初始化");
    }

    try {
      // 使用BIP44路徑獲取地址: 44'/354'/accountIndex'/0'/0'
      // 354' 是Polkadot的幣種類型
      const result = await this.app.getAddress(`44'/354'/${accountIndex}'/0'/0'`, false);

      return {
        address: result.address,
        pubKey: result.pubKey,
        index: accountIndex
      };
    } catch (error) {
      console.error("獲取Ledger地址失敗:", error);
      throw error;
    }
  }

  // 簽名交易
  public async signTransaction(accountIndex: number, transaction: any): Promise<string> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.app) {
      throw new Error("Ledger應用未初始化");
    }

    try {
      // 獲取待簽名的payload
      const signingPayload = transaction.toPayload();

      // 使用Ledger進行簽名
      const { signature } = await this.app.signTransaction(
        `44'/354'/${accountIndex}'/0'/0'`,
        signingPayload
      );

      return signature;
    } catch (error) {
      console.error("Ledger簽名失敗:", error);
      throw error;
    }
  }

  // 斷開連接
  public async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
      this.app = null;
      this.connected = false;
    }
  }
}

// 導出單例
export default new LedgerService();
