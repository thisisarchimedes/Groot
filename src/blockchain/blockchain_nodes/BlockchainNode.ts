import Web3, {AbiItem} from 'web3';
import {Logger} from '../../service/logger/Logger';

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
  protected web3!: Web3;
  protected readonly logger: Logger;
  protected isNodeHealthy: boolean = true;
  protected nodeName: string = '';

  constructor(logger: Logger, nodeName: string) {
    this.logger = logger;
    this.nodeName = nodeName;
  }

  abstract startNode(): Promise<void>;
  abstract stopNode(): Promise<void>;
  abstract resetNode(externalProviderRpcUrl: string): Promise<void>;
  abstract recoverNode(): Promise<void>;

  abstract getBlockNumber(): Promise<number>;

  abstract callViewFunction(
    contractAddress: string,
    abi: AbiItem[],
    functionName: string,
    params: unknown[],
  ): Promise<unknown>;

  public isHealthy(): boolean {
    return this.isNodeHealthy;
  }

  public getNodeName(): string {
    return this.nodeName;
  }

  public async getProxyInfoForAddress(proxyAddress: string): Promise<BlockchainNodeProxyInfo> {
    const PROXY_STORAGE_POSITION_OPZEP = '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3';
    const PROXY_STORAGE_POSITION_EIP1967 = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
    const PROXY_INVALID_IMPLEMENTATION_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000';

    const [eip1967Result, openzeppelinResult] = await Promise.all([
      this.web3.eth.getStorageAt(proxyAddress, PROXY_STORAGE_POSITION_EIP1967),
      this.web3.eth.getStorageAt(proxyAddress, PROXY_STORAGE_POSITION_OPZEP),
    ]);

    const removeLeadingZeros = (address: string): string => {
      return '0x' + address.slice(26);
    };

    if (eip1967Result === PROXY_INVALID_IMPLEMENTATION_ADDRESS &&
      openzeppelinResult === PROXY_INVALID_IMPLEMENTATION_ADDRESS) {
      return {
        isProxy: false,
        implementationAddress: '',
      };
    } else if (eip1967Result === PROXY_INVALID_IMPLEMENTATION_ADDRESS) {
      return {
        isProxy: true,
        implementationAddress: removeLeadingZeros(openzeppelinResult),
      };
    } else if (openzeppelinResult === PROXY_INVALID_IMPLEMENTATION_ADDRESS) {
      return {
        isProxy: true,
        implementationAddress: removeLeadingZeros(eip1967Result),
      };
    } else {
      return {
        isProxy: true,
        implementationAddress: removeLeadingZeros(eip1967Result),
      };
    }
  }
}

export interface BlockchainNodeProxyInfo {
  isProxy: boolean;
  implementationAddress: string
}
