import axios from 'axios';
import { injectable, inject } from 'inversify';

import { JsonRpcProvider } from 'ethers';
import { BlockchainNode, BlockchainNodeError } from './BlockchainNode';
import { IBlockchainNodeLocal } from './interfaces/IBlockchainNodeLocal';
import { ILoggerAll } from '../../service/logger/interfaces/ILoggerAll';

@injectable()
export class BlockchainNodeLocal extends BlockchainNode implements IBlockchainNodeLocal {
  private readonly localRpcUrl: string;

  constructor(
    @inject("ILoggerAll") _logger: ILoggerAll,
    @inject("MainLocalNodeURI") localRpcUrl: string,
    @inject("AlchemyNodeLabel") nodeName: string
  ) {
    super(_logger, nodeName);
    this.localRpcUrl = localRpcUrl;
    this.logger.debug(`Initializing ${this.nodeName} with local RPC URL: ${localRpcUrl}`);
    this.provider = new JsonRpcProvider(localRpcUrl);
  }

  public async startNode(): Promise<void> {
    this.logger.debug(`Starting local node...${this.localRpcUrl}`);
    await this.waitForNodeToBeReady();
  }

  public async stopNode(): Promise<void> {
    // Do nothing, as we don't manage this node directly
  }

  public async recoverNode(): Promise<void> {
    this.logger.info('Trying to recover node...');
    await this.stopNode();
    await this.startNode();
    this.logger.info('Node recovered successfully.');
    this.isNodeHealthy = true;
  }

  public async resetNode(externalProviderRpcUrl: string): Promise<void> {
    try {
      const responseData = await this.performResetRpcCall(externalProviderRpcUrl);
      this.handleResetResponse(responseData);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to reset node: ${error.message}`);
        throw error instanceof BlockchainNodeError ? error : new BlockchainNodeError(error.message);
      } else {
        this.logger.error(`Failed to reset node: ${error}`);
        throw new BlockchainNodeError('Unknown error');
      }
    }

    await this.waitForNodeToBeReady();
  }

  protected async waitForNodeToBeReady(maxAttempts: number = 8, interval: number = 3000): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const blockNumber = await this.getBlockNumber();
        this.logger.debug(`Blockchain is ready. Current block number is ${blockNumber}.`);
        return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        this.logger.debug(`Waiting for blockchain... Attempt ${attempt}/${maxAttempts} - ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
    throw new BlockchainNodeError('Blockchain node is not ready after maximum attempts.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async performResetRpcCall(externalProviderRpcUrl: string): Promise<any> {
    try {
      const response = await axios.post(this.localRpcUrl, {
        jsonrpc: '2.0',
        method: 'hardhat_reset',
        params: [{ forking: { jsonRpcUrl: externalProviderRpcUrl } }],
        id: 1,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`HTTP Error: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from the server');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleResetResponse(data: any): void {
    if (typeof data === 'object' && data !== null && 'error' in data) {
      const error = data.error as { message: string };
      const msg = `RPC Error: ${error.message}`;
      throw new BlockchainNodeError(msg);
    }
    this.logger.debug('Node reset successfully.');
  }
}
