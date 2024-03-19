import Web3 from 'web3';
import fetch from 'node-fetch';

import {BlockchainNode, BlockchainNodeError} from './BlockchainNode';
import {Logger} from '../../service/logger/Logger';

export class BlockchainNodeLocal extends BlockchainNode {
  private readonly localRpcUrl: string;

  constructor(logger: Logger, localRpcUrl: string, nodeName: string) {
    super(logger, nodeName);

    this.localRpcUrl = localRpcUrl;
    this.web3 = new Web3(this.localRpcUrl);
  }

  public async startNode(): Promise<void> {
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
      this.logger.error(`Failed to reset node: ${(error as Error).message}`);
      throw error instanceof BlockchainNodeError ? error : new BlockchainNodeError((error as Error).message);
    }

    await this.waitForNodeToBeReady();
  }

  protected async waitForNodeToBeReady(maxAttempts: number = 8, interval: number = 3000): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const blockNumber = await this.getBlockNumber();
        this.logger.debug(`Blockchain is ready. Current block number is ${blockNumber}.`);
        return;
      } catch (error) {
        this.logger.debug(`Waiting for blockchain... Attempt ${attempt}/${maxAttempts} - ${(error as Error).message}`);
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
    throw new BlockchainNodeError('Blockchain node is not ready after maximum attempts.');
  }

  private async performResetRpcCall(externalProviderRpcUrl: string): Promise<unknown> {
    const response = await fetch(this.localRpcUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'hardhat_reset',
        params: [{forking: {jsonRpcUrl: externalProviderRpcUrl}}],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private handleResetResponse(data: unknown): void {
    if (typeof data === 'object' && data !== null && 'error' in data) {
      const error = data.error as { message: string };
      const msg = `RPC Error: ${error.message}`;
      throw new BlockchainNodeError(msg);
    }
    this.logger.debug('Node reset successfully.');
  }
}
