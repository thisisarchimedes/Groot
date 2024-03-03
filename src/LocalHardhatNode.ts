import Web3 from 'web3';
import Docker from 'dockerode';

export class LocalHardhatNodeResetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalHardhatNodeResetError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LocalHardhatNodeResetError);
    }
  }
}

export class LocalHardhatNode {
  private readonly web3: Web3;
  private readonly docker: Docker = new Docker({socketPath: '/var/run/docker.sock'});
  private readonly localRpcUrl: string;
  private readonly containerPort: number;
  private readonly imageName: string;
  private readonly containerName: string;

  constructor(port: number, imageName: string, containerName: string) {
    this.localRpcUrl = `http://127.0.0.1:${port}`;
    this.web3 = new Web3(this.localRpcUrl);
    this.containerPort = port;
    this.imageName = imageName;
    this.containerName = containerName;
  }

  public getBlockNumber(): Promise<bigint> {
    return this.web3.eth.getBlockNumber();
  }

  public async resetNode(externalProviderRpcUrl: string): Promise<void> {
    try {
      const responseData = await this.performResetRpcCall(externalProviderRpcUrl);
      this.handleResetResponse(responseData);
    } catch (error) {
      console.error(`Failed to reset node: ${error.message}`);
      throw error instanceof LocalHardhatNodeResetError ? error : new LocalHardhatNodeResetError(error.message);
    }
  }

  public async startNodeContainer() {
    const containerExists = await this.checkContainerExists();
    if (containerExists) {
      await this.ensureContainerStarted();
    } else {
      await this.createAndStartContainer();
    }
  }

  public async stopNodeContainer() {
    try {
      const container = this.docker.getContainer(this.containerName);
      const containerInfo = await container.inspect();

      if (containerInfo.State.Running) {
        console.log(`Stopping container ${this.containerName}...`);
        await container.stop();
        console.log(`Container ${this.containerName} has been stopped.`);
      } else {
        console.log(`Container ${this.containerName} is not running.`);
      }
    } catch (error) {
      if (error.statusCode === 404) {
        console.log(`Container ${this.containerName} does not exist.`);
      } else {
        console.error(`Error stopping container ${this.containerName}:`, error);
      }
    }
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
      throw new LocalHardhatNodeResetError(msg);
    }

    console.log('Node reset successfully.');
  }

  private async checkContainerExists(): Promise<boolean> {
    try {
      const container = this.docker.getContainer(this.containerName);
      await container.inspect();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async ensureContainerStarted() {
    const container = this.docker.getContainer(this.containerName);
    const info = await container.inspect();
    if (!info.State.Running) {
      console.log(`Starting existing container ${this.containerName}...`);
      await container.start();
      console.log(`Container ${this.containerName} started.`);
    } else {
      console.log(`Container ${this.containerName} is already running.`);
    }
  }

  private async createAndStartContainer() {
    console.log(`Creating container ${this.containerName}...`);
    const container = await this.docker.createContainer({
      Image: this.imageName,
      name: this.containerName,
      ExposedPorts: {[`${this.containerPort}/tcp`]: {}},
      HostConfig: {
        PortBindings: {[`${this.containerPort}/tcp`]: [{HostPort: `${this.containerPort.toString()}`}]},
      },
    });

    await container.start();
    console.log(`Container ${this.containerName} created with ports ${this.containerPort}:${this.containerPort}.`);
  }

  public async waitForNodeToBeReady(maxAttempts = 8, interval = 3000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const blockNumber = await this.getBlockNumber();
        console.log(`Blockchain is ready. Current block number is ${blockNumber}.`);
        return;
      } catch (error) {
        console.log(`Waiting for blockchain to be ready... Attempt ${attempt}/${maxAttempts}`);
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
    throw new Error('Blockchain node is not ready after maximum attempts.');
  }
}
