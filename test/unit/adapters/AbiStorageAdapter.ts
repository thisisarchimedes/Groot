import {IAbiStorage} from '../../../src/rule_engine/tool/abi_repository/IAbiStorage';

export class AbiStorageAdapter implements IAbiStorage {
  private returnAbi: string | null = null;

  public storeAbiForAddress(contractAddress: string, abi: string): Promise<void> {
    this.returnAbi = abi;
  }
  public getAbiForAddress(contractAddress: string): Promise<string | null> {
    return Promise.resolve(this.returnAbi);
  }

  public setReturnValue(abi: string | null): void {
    this.returnAbi = abi;
  }
}
