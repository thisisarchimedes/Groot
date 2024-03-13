import Web3, {AbiItem} from 'web3';

import {BlockchainNode} from './BlockchainNode';
import {Logger} from '../../service/logger/Logger';

export class BlockchainNodeRemoteRPC extends BlockchainNode {
  private readonly remoteRpcUrl: string;
  private readonly SLEEP_DURATION_WHEN_RECOVERING_NODE = 10000;

  constructor(logger: Logger, remoteRpcUrl: string, nodeName: string) {
    super(logger, nodeName);

    this.remoteRpcUrl = remoteRpcUrl;
    this.web3 = new Web3(remoteRpcUrl);
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
    this.logger.info('Trying to recover node...');
    await this.busySleep(this.SLEEP_DURATION_WHEN_RECOVERING_NODE);
    await this.getBlockNumber();
    this.logger.info('Node recovered successfully.');
    this.isNodeHealthy = true;
  }

  public async getBlockNumber(): Promise<number> {
    try {
      const blockNumber = await this.web3.eth.getBlockNumber();
      this.isNodeHealthy = true;
      return Number(blockNumber);
    } catch (error) {
      this.logger.info(`${this.nodeName} cannot get block number: ${(error as Error).message}`);
      this.isNodeHealthy = false;
      throw error;
    }
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
      this.isNodeHealthy = true;
      return data;
    } catch (error) {
      this.logger.info(`${this.nodeName} Cannot call view function ${functionName}: ${error}`);
      this.isNodeHealthy = false;
      throw error;
    }
  }

  private busySleep(duration: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  }
}
