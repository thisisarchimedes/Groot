import { ethers, Contract } from 'ethers';
import { Logger } from '../../service/logger/Logger';

export class BlockchainNodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockchainNodeError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BlockchainNodeError);
    }
  }
}

export abstract class BlockchainNode {
  protected provider!: ethers.Provider;
  protected readonly logger: Logger;
  protected isNodeHealthy: boolean = true;
  protected nodeName: string = '';

  constructor(logger: Logger, nodeName: string) {
    this.logger = logger;
    this.nodeName = nodeName;
  }

  public async getBlockNumber(): Promise<number> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      this.isNodeHealthy = true;
      return blockNumber;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.info(`${this.nodeName} cannot get block number: ${error.message}`);
      }
      this.isNodeHealthy = false;
      throw new BlockchainNodeError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  public async callViewFunction(
    contractAddress: string,
    abi: ethers.Interface,
    functionName: string,
    params: unknown[] = [],
  ): Promise<unknown> {
    const contract = new Contract(contractAddress, abi, this.provider);

    try {
      const data = await contract[functionName](...params);
      this.isNodeHealthy = true;
      return data;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.info(`${this.nodeName} Cannot call view function ${functionName}: ${error.message}`);
        this.isNodeHealthy = false;
        throw new BlockchainNodeError(error.message);
      } else {
        this.logger.info(`${this.nodeName} Cannot call view function ${functionName}: ${error}`);
        this.isNodeHealthy = false;
        throw new BlockchainNodeError('Unknown error');
      }
    }
  }

  abstract startNode(): Promise<void>;
  abstract stopNode(): Promise<void>;
  abstract resetNode(externalProviderRpcUrl: string): Promise<void>;
  abstract recoverNode(): Promise<void>;

  public isHealthy(): boolean {
    return this.isNodeHealthy;
  }

  public getNodeName(): string {
    return this.nodeName;
  }

  public async getProxyInfoForAddress(proxyAddress: string): Promise<BlockchainNodeProxyInfo> {
    const [eip1967Result, openzeppelinResult] = await Promise.all([
      this.getStorageAt(proxyAddress, ProxyStoragePosition.EIP1967),
      this.getStorageAt(proxyAddress, ProxyStoragePosition.OpenZeppelin),
    ]);

    if (this.isInvalidImplementationAddress(eip1967Result) && this.isInvalidImplementationAddress(openzeppelinResult)) {
      return BlockchainNodeProxyInfo.notProxy();
    } else if (this.isInvalidImplementationAddress(eip1967Result)) {
      return BlockchainNodeProxyInfo.proxy(this.removeLeadingZeros(openzeppelinResult));
    } else if (this.isInvalidImplementationAddress(openzeppelinResult)) {
      return BlockchainNodeProxyInfo.proxy(this.removeLeadingZeros(eip1967Result));
    } else {
      return BlockchainNodeProxyInfo.proxy(this.removeLeadingZeros(eip1967Result));
    }
  }

  private async getStorageAt(address: string, position: string): Promise<string> {
    return await this.provider.getStorage(address, position);
  }

  private isInvalidImplementationAddress(address: string): boolean {
    return address === ProxyStoragePosition.InvalidImplementationAddress;
  }

  private removeLeadingZeros(address: string): string {
    return ethers.getAddress('0x' + address.slice(26));
  }

  protected busySleep(duration: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  }
}

export class BlockchainNodeProxyInfo {
  private constructor(
    public readonly isProxy: boolean,
    public readonly implementationAddress: string,
  ) { }

  static notProxy(): BlockchainNodeProxyInfo {
    return new BlockchainNodeProxyInfo(false, '');
  }

  static proxy(implementationAddress: string): BlockchainNodeProxyInfo {
    return new BlockchainNodeProxyInfo(true, implementationAddress);
  }
}

enum ProxyStoragePosition {
  OpenZeppelin = '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3',
  EIP1967 = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
  InvalidImplementationAddress = '0x000000000000000000000000000000000000'
}