/* eslint-disable @typescript-eslint/no-unused-vars */
import {IAbiFetcher} from '../../../src/rule_engine/tool/abi_repository/IAbiFetcher';

export class AbiFetcherAdapter implements IAbiFetcher {
  private returnAbi: string = '';

  public getAbiByAddress(contractAddress: string): Promise<string> {
    return Promise.resolve(this.returnAbi);
  }

  public setReturnValue(abi: string): void {
    this.returnAbi = abi;
  }
}
