import {injectable, inject} from 'inversify';
import {Interface} from 'ethers';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {ILoggerAll} from '../../service/logger/interfaces/ILoggerAll';
import {IBlockchainNode} from '../blockchain_nodes/interfaces/IBlockchainNode';
import {IBlockchainNodeLocal} from '../blockchain_nodes/interfaces/IBlockchainNodeLocal';
import {BlockchainNodeProxyInfo} from '../blockchain_nodes/BlockchainNodeProxyInfo';
import {IBlockchainReader} from './interfaces/IBlockchainReader';

export class BlockchainReaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockChainReaderError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BlockchainReaderError);
    }
  }
}

interface NodeResponse {
  response: unknown | null;
  blockNumber: number | null;
}

interface ValidNodeResponse {
  response: unknown;
  blockNumber: number;
}

@injectable()
export class BlockchainReader implements IBlockchainReader {
  private readonly nodes: IBlockchainNode[];
  private readonly logger: ILogger;

  private initialized: boolean;

  constructor(
    @inject('ILoggerAll') _logger: ILoggerAll,
    @inject('BlockchainNodeLocalMain') _mainLocalNode: IBlockchainNodeLocal,
    @inject('BlockchainNodeLocalAlt') _altLocalNode: IBlockchainNodeLocal) {
    this.nodes = [_mainLocalNode, _altLocalNode];
    this.logger = _logger;
    this.initialized = false;
  }

  private async init() {
    if (!this.initialized) {
      await Promise.all([
        this.nodes[0].startNode(),
        this.nodes[0].startNode(),
      ]);
    }
  }

  public async getBlockNumber(): Promise<number> {
    await this.init();
    const blockNumbers = await this.fetchBlockNumbersFromNodes();
    const validBlockNumbers = this.extractValidBlockNumbers(blockNumbers);
    this.ensureValidBlockNumbers(validBlockNumbers);
    return this.findHighestBlockNumber(validBlockNumbers);
  }

  public async callViewFunction(
      contractAddress: string,
      abi: Interface,
      functionName: string,
      params: unknown[] = [],
  ): Promise<unknown> {
    await this.init();
    const nodeResponses = await this.fetchNodeResponses(contractAddress, abi, functionName, params);
    const validNodeResponses = this.extractValidNodeResponses(nodeResponses);
    this.ensureValidNodeResponses(validNodeResponses);
    return this.findResponseFromNodeWithHighestBlockNumber(validNodeResponses);
  }

  public async getProxyInfoForAddress(proxyAddress: string): Promise<BlockchainNodeProxyInfo> {
    await this.init();
    const proxyInfoResults = await this.fetchProxyInfoFromNodes(proxyAddress);

    for (const proxyInfo of proxyInfoResults) {
      if (proxyInfo) {
        return proxyInfo;
      }
    }

    throw new BlockchainReaderError('Error when requesting proxy information from node.');
  }

  private fetchBlockNumbersFromNodes(): Promise<(number | null)[]> {
    const blockNumberPromises = this.nodes.map((node) =>
      node.getBlockNumber().catch(() => null),
    );
    return Promise.all(blockNumberPromises);
  }

  private extractValidBlockNumbers(blockNumbers: (number | null)[]): number[] {
    return blockNumbers.filter((blockNumber): blockNumber is number => blockNumber !== null);
  }

  private ensureValidBlockNumbers(validBlockNumbers: number[]): void {
    if (validBlockNumbers.length === 0) {
      this.logger.error('All nodes failed to retrieve block number');
      throw new BlockchainReaderError('All nodes failed to retrieve block number');
    }
  }

  private findHighestBlockNumber(blockNumbers: number[]): number {
    return Math.max(...blockNumbers);
  }

  private async fetchNodeResponses(
      contractAddress: string,
      abi: Interface,
      functionName: string,
      params: unknown[],
  ): Promise<NodeResponse[]> {
    const functionCalls = this.nodes.map((node) =>
      node.callViewFunction(contractAddress, abi, functionName, params).catch(() => null),
    );
    const blockNumbers = this.nodes.map((node) =>
      node.getBlockNumber().catch(() => null),
    );

    const [settledFunctionCalls, settledBlockNumbers] = await Promise.all([
      Promise.allSettled(functionCalls),
      Promise.allSettled(blockNumbers),
    ]);

    return settledFunctionCalls.map((result, index) => ({
      response: this.extractFulfilledValue(result),
      blockNumber: this.extractFulfilledValue(settledBlockNumbers[index]),
    }));
  }

  private extractFulfilledValue<T>(result: PromiseSettledResult<T>): T | null {
    return result.status === 'fulfilled' ? result.value : null;
  }

  private extractValidNodeResponses(nodeResponses: NodeResponse[]): ValidNodeResponse[] {
    return nodeResponses.filter(
        (nodeResponse): nodeResponse is ValidNodeResponse =>
          nodeResponse.response !== null && nodeResponse.blockNumber !== null,
    );
  }

  private ensureValidNodeResponses(validNodeResponses: ValidNodeResponse[]): void {
    if (validNodeResponses.length === 0) {
      this.logger.error('All nodes failed to retrieve block number');
      throw new BlockchainReaderError('All nodes failed to execute callViewFunction or getBlockNumber');
    }
  }

  private findResponseFromNodeWithHighestBlockNumber(validNodeResponses: ValidNodeResponse[]): unknown {
    const highestBlockNumberIndex = validNodeResponses.reduce(
        (highestIndex, currentNode, currentIndex) =>
        currentNode.blockNumber > validNodeResponses[highestIndex].blockNumber ? currentIndex : highestIndex,
        0,
    );
    return validNodeResponses[highestBlockNumberIndex].response;
  }

  private async fetchProxyInfoFromNodes(proxyAddress: string): Promise<BlockchainNodeProxyInfo[]> {
    const proxyInfoPromises = this.nodes.map((node) =>
      node.getProxyInfoForAddress(proxyAddress).catch(() => null),
    );
    const res: BlockchainNodeProxyInfo[] = await Promise.all(proxyInfoPromises) as BlockchainNodeProxyInfo[];
    return res;
  }
}
