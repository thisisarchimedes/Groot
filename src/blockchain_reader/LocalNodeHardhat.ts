import Web3, {AbiItem} from 'web3';
import {DockerOperator} from './DockerOperator';
import {LocalNode, LocalNodeError} from './LocalNode';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class LocalNodeHardhat implements LocalNode {
  private readonly web3: Web3;
  private readonly dockerOperator: DockerOperator;

  private readonly localRpcUrl: string;
  private readonly nodePort: number;
  private readonly nodeName: string;

  private readonly DEFAULT_HARDHAT_NODE_PORT = 8545;
  private readonly DEFAULT_HARDHAT_DOCKER_IMAGE_NAME = 'arch-production-node:latest';

  constructor(externalPort: number, nodeName: string) {
    this.localRpcUrl = `http://127.0.0.1:${externalPort}`;
    this.web3 = new Web3(this.localRpcUrl);
    this.nodePort = externalPort;
    this.nodeName = nodeName;

    this.dockerOperator = new DockerOperator({
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

  public async resetNode(externalProviderRpcUrl: string): Promise<void> {
    try {
      const responseData = await this.performResetRpcCall(externalProviderRpcUrl);
      this.handleResetResponse(responseData);
    } catch (error) {
      console.error(`Failed to reset node: ${(error as Error).message}`);
      throw error instanceof LocalNodeError ? error : new LocalNodeError((error as Error).message);
    }

    await this.waitForNodeToBeReady();
  }

  public getBlockNumber(): Promise<bigint> {
    return this.web3.eth.getBlockNumber();
  }

  public async callViewFunction(
      contractAddress: string,
      abi: AbiItem[],
      functionName: string,
      params: any[] = [],
  ): Promise<any> {
    const contract = new this.web3.eth.Contract(abi, contractAddress);

    try {
      const data = await contract.methods[functionName](...params).call();
      return data;
    } catch (error) {
      console.error(`Error calling view function ${functionName}:`, error);
      throw error;
    }
  }

  private async waitForNodeToBeReady(maxAttempts: number = 8, interval: number = 3000): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const blockNumber = await this.getBlockNumber();
        console.log(`Blockchain is ready. Current block number is ${blockNumber}.`);
        return;
      } catch (error) {
        console.log(`Waiting for blockchain... Attempt ${attempt}/${maxAttempts} - ${(error as Error).message}`);
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
    throw new LocalNodeError('Blockchain node is not ready after maximum attempts.');
  }

  private async performResetRpcCall(externalProviderRpcUrl: string): Promise<any> {
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

  private handleResetResponse(data: any): void {
    if (data.error) {
      const msg = `RPC Error: ${data.error.message}`;
      throw new LocalNodeError(msg);
    }

    console.log('Node reset successfully.');
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
