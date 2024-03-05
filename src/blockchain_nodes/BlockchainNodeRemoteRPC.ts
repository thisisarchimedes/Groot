import Web3, {AbiItem} from 'web3';

import {BlockchainNode} from './BlockchainNode';
import {Logger} from '../service/Logger';

export class BlockchainNodeRemoteRPC implements BlockchainNode {
  private readonly web3: Web3;

  private readonly remoteRpcUrl: string;
  private readonly nodeName: string;

  private readonly SLEEP_DURATION_WHEN_RECOVERING_NODE = 10000;

  constructor(remoteRpcUrl: string, nodeName: string) {
    this.remoteRpcUrl = remoteRpcUrl;
    this.web3 = new Web3(remoteRpcUrl);
    this.nodeName = nodeName;
  }

  public async startNode(): Promise<void> {
    // Do nothing, as this is a remote node
  }

  public async stopNode(): Promise<void> {
    // Do nothing, as this is a remote node
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async resetNode(externalProviderRpcUrl: string): Promise<void> {
    // Do nothing, as this is a remote node
  }

  public async recoverNode(): Promise<void> {
    Logger.info('Trying to recover node...');
    await this.busySleep(this.SLEEP_DURATION_WHEN_RECOVERING_NODE);    
    await this.getBlockNumber();
    Logger.info('Node recovered successfully.');
  }

  public async getBlockNumber(): Promise<number> {
    const blockNumber = await this.web3.eth.getBlockNumber();
    return Number(blockNumber);
  }

  public async callViewFunction(
      contractAddress: string,
      abi: AbiItem[],
      functionName: string,
      params: unknown[] = [],
  ): Promise<unknown> {
    const contract = new this.web3.eth.Contract(abi, contractAddress);

    try {
      const data = await contract.methods[functionName](...params).call();
      return data;
    } catch (error) {
      Logger.error(`Error calling view function ${functionName}: ${error}`);
      throw error;
    }
  }

  private async busySleep(duration: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  }
}
