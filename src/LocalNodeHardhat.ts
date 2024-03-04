import Web3 from 'web3';
import {DockerOperator} from './DockerOperator';

export class LocalNodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalNodeError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LocalNodeError);
    }
  }
}

export class LocalNodeHardhat {
  private readonly web3: Web3;
  private readonly dockerOperator: DockerOperator;

  private readonly localRpcUrl: string;
  private readonly nodePort: number;
  private readonly nodeName: string;

  private readonly DEFAULT_HARDHAT_NODE_PORT = 8545;

  constructor(externalPort: number, nodeName: string) {
    this.localRpcUrl = `http://127.0.0.1:${externalPort}`;
    this.web3 = new Web3(this.localRpcUrl);
    this.nodePort = externalPort;
    this.nodeName = nodeName;

    this.dockerOperator = new DockerOperator({
      portExternal: externalPort,
      portInternal: this.DEFAULT_HARDHAT_NODE_PORT,
      imageName: 'archimedes-node',
      instanceName: nodeName,
    });
  }

  public async startNode() {
    await this.dockerOperator.startContainer();
    await this.waitForNodeToBeReady();
  }

  public async stopNode() {
    await this.dockerOperator.stopContainer();
  }

  public async resetNode(externalProviderRpcUrl: string): Promise<void> {
    try {
      const responseData = await this.performResetRpcCall(externalProviderRpcUrl);
      this.handleResetResponse(responseData);
    } catch (error) {
      console.error(`Failed to reset node: ${error.message}`);
      throw error instanceof LocalNodeError ? error : new LocalNodeError(error.message);
    }

    await this.waitForNodeToBeReady();
  }


  public getBlockNumber(): Promise<bigint> {
    return this.web3.eth.getBlockNumber();
  }

  public async callViewFunction(
      contractAddress: string,
      abi: any[],
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

  private async waitForNodeToBeReady(maxAttempts = 8, interval = 3000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const blockNumber = await this.getBlockNumber();
        console.log(`Blockchain is ready. Current block number is ${blockNumber}.`);
        return;
      } catch (error) {
        console.log(`Waiting for blockchain to be ready... Attempt ${attempt}/${maxAttempts} - ${error.message}`);
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
