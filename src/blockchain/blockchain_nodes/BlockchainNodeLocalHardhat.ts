import Web3, {AbiItem} from 'web3';
import {DockerOperator} from '../blockchain_reader/DockerOperator';
import {BlockchainNode, BlockchainNodeError} from './BlockchainNode';
import {Logger} from '../../service/logger/Logger';

export class BlockchainNodeLocalHardhat extends BlockchainNode {
  private readonly web3: Web3;
  private readonly dockerOperator: DockerOperator;

  private readonly localRpcUrl: string;
  private readonly nodePort: number;

  private readonly DEFAULT_HARDHAT_NODE_PORT = 8545;
  private readonly DEFAULT_HARDHAT_DOCKER_IMAGE_NAME = 'arch-production-node:latest';

  constructor(logger: Logger, externalPort: number, nodeName: string) {
    super(logger, nodeName);

    this.localRpcUrl = `http://127.0.0.1:${externalPort}`;
    this.web3 = new Web3(this.localRpcUrl);

    this.nodePort = externalPort;

    this.dockerOperator = new DockerOperator(logger,
        {
          portExternal: externalPort,
          portInternal: this.DEFAULT_HARDHAT_NODE_PORT,
          imageName: this.DEFAULT_HARDHAT_DOCKER_IMAGE_NAME,
          instanceName: nodeName,
        });
  }

  public async startNode(): Promise<void> {
    await this.dockerOperator.startContainer();
    await this.waitForNodeToBeReady();
  }

  public async stopNode(): Promise<void> {
    await this.dockerOperator.stopContainer();
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
      this.logger.info(`${this.nodeName} cannot call view function ${functionName}: ${error}`);
      this.isNodeHealthy = false;
      throw error;
    }
  }

  private async waitForNodeToBeReady(maxAttempts: number = 8, interval: number = 3000): Promise<void> {
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
