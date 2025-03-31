// src/utils/polkadot.ts
import { ApiPromise, WsProvider } from '@polkadot/api';
import {
  createKeyMulti,
  encodeAddress,
  sortAddresses
} from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';
import ledgerService from './ledger';
import { MultisigInfo, BalanceInfo, TransactionResult, Timepoint } from './types';

class PolkadotService {
  private api: ApiPromise | null = null;
  private network: string = 'polkadot';
  private prefix: number = 0; // Polkadot的SS58前綴

  // 連接到Polkadot網絡
  public async connect(network: string = 'polkadot'): Promise<ApiPromise> {
    if (this.api) return this.api;

    // 根據選擇的網絡設置前綴和端點
    this.network = network;
    this.prefix = this.getNetworkPrefix(network);
    const wsEndpoint = this.getNetworkEndpoint(network);

    // 創建API實例
    const provider = new WsProvider(wsEndpoint);
    this.api = await ApiPromise.create({ provider });
    console.log(`已連接到${network}網絡`);

    return this.api;
  }

  // 創建多簽地址
  public createMultisigAddress(addresses: string[], threshold: number): MultisigInfo {
    // 確保地址格式正確並排序
    const sortedAddresses = sortAddresses(addresses, this.prefix);

    // 驗證閾值
    if (threshold > sortedAddresses.length) {
      throw new Error('閾值不能大於簽名者數量');
    }

    if (threshold < 2) {
      throw new Error('多簽至少需要2個簽名');
    }

    // 創建多簽地址
    const multiAddress = createKeyMulti(sortedAddresses, threshold);

    // 轉換為指定網絡的地址格式
    const ss58Address = encodeAddress(multiAddress, this.prefix);

    return {
      multisigAddress: ss58Address,
      signatories: sortedAddresses,
      threshold
    };
  }

  // 獲取帳戶餘額
  public async getBalance(address: string): Promise<BalanceInfo> {
    if (!this.api) {
      await this.connect();
    }

    if (!this.api) {
      throw new Error("API未初始化");
    }

    const { data: balance } = await this.api.query.system.account(address);
    return {
      free: balance.free.toString(),
      reserved: balance.reserved.toString(),
      total: balance.free.add(balance.reserved).toString()
    };
  }

  // 創建轉賬交易
  public async createTransferTransaction(destination: string, amount: string | number): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
    if (!this.api) {
      await this.connect();
    }

    if (!this.api) {
      throw new Error("API未初始化");
    }

    return this.api.tx.balances.transfer(destination, amount);
  }

  // 初始化多簽交易
  public async initiateMultisigTransaction(
    multisigInfo: MultisigInfo,
    tx: SubmittableExtrinsic<"promise", ISubmittableResult>,
    senderIndex: number = 0
  ): Promise<TransactionResult> {
    if (!this.api) {
      await this.connect();
    }

    if (!this.api) {
      throw new Error("API未初始化");
    }

    // 取得當前發送者的地址
    const sender = multisigInfo.signatories[senderIndex];

    // 過濾出其他簽名者
    const otherSignatories = multisigInfo.signatories.filter(addr => addr !== sender);

    // 排序其他簽名者地址
    const otherSignatoriesSorted = sortAddresses(otherSignatories, this.prefix);

    // 創建多簽交易
    const multisigTx = this.api.tx.multisig.asMulti(
      multisigInfo.threshold,
      otherSignatoriesSorted,
      null, // timepoint參數，用於批准時使用
      tx,
      0 // weightLimit, 0表示最大
    );

    try {
      // 使用Ledger簽名
      const signature = await ledgerService.signTransaction(senderIndex, multisigTx);

      // 添加簽名到交易
      const signedTx = multisigTx.addSignature(sender, signature, multisigTx.nonce);

      // 發送交易
      const txHash = await signedTx.send();

      return {
        txHash: txHash.toString(),
        sender,
        multisigAddress: multisigInfo.multisigAddress
      };
    } catch (error) {
      console.error("多簽交易失敗:", error);
      throw error;
    }
  }

  // 批准多簽交易
  public async approveMultisigTransaction(
    multisigInfo: MultisigInfo,
    callHash: string,
    timepoint: Timepoint,
    approverIndex: number
  ): Promise<TransactionResult> {
    if (!this.api) {
      await this.connect();
    }

    if (!this.api) {
      throw new Error("API未初始化");
    }

    // 獲取當前簽名者的地址
    const approver = multisigInfo.signatories[approverIndex];

    // 過濾出其他簽名者
    const otherSignatories = multisigInfo.signatories.filter(addr => addr !== approver);

    // 排序其他簽名者地址
    const otherSignatoriesSorted = sortAddresses(otherSignatories, this.prefix);

    // 創建批准交易
    const approveTx = this.api.tx.multisig.approveAsMulti(
      multisigInfo.threshold,
      otherSignatoriesSorted,
      timepoint,
      callHash,
      0 // weightLimit
    );

    try {
      // 使用Ledger簽名
      const signature = await ledgerService.signTransaction(approverIndex, approveTx);

      // 添加簽名到交易
      const signedTx = approveTx.addSignature(approver, signature, approveTx.nonce);

      // 發送交易
      const txHash = await signedTx.send();

      return {
        txHash: txHash.toString(),
        sender: approver,
        multisigAddress: multisigInfo.multisigAddress
      };
    } catch (error) {
      console.error("批准多簽交易失敗:", error);
      throw error;
    }
  }

  // 根據網絡名稱獲取SS58前綴
  private getNetworkPrefix(network: string): number {
    switch (network.toLowerCase()) {
      case 'polkadot':
        return 0;
      case 'kusama':
        return 2;
      case 'westend':
        return 42;
      default:
        return 0;
    }
  }

  // 獲取網絡端點
  private getNetworkEndpoint(network: string): string {
    switch (network.toLowerCase()) {
      case 'polkadot':
        return 'wss://rpc.polkadot.io';
      case 'kusama':
        return 'wss://kusama-rpc.polkadot.io';
      case 'westend':
        return 'wss://westend-rpc.polkadot.io';
      default:
        return 'wss://rpc.polkadot.io';
    }
  }
}

export default new PolkadotService();
