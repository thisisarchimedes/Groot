
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {BlockchainNodeProxyInfo} from '../blockchain_nodes/BlockchainNodeProxyInfo';
import {BlockchainNode} from '../blockchain_nodes/BlockchainNode';
import {Block} from 'ethers';
import {ModulesParams} from '../../types/ModulesParams';

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


export class BlockchainReader {
  private readonly nodes: BlockchainNode[];
  private readonly logger: ILogger;

  private initialized: boolean;

  constructor(
      modulesParams: ModulesParams,
  ) {
    this.nodes = [modulesParams.mainNode!, modulesParams.altNode!];
    this.logger = modulesParams.logger!;
    this.initialized = false;
  }

  private async init() {
    if (!this.initialized) {
      const initPromises = this.nodes.map((node) =>
        node.startNode(),
      );
      await Promise.all(initPromises);
      this.initialized = true;
    }
  }

  public async getBlockNumber(): Promise<number> {
    await this.init();
    const blockNumbers = await this.fetchBlockNumbersFromNodes();
    const validBlockNumbers = this.extractValidBlockNumbers(blockNumbers);
    this.ensureValidBlockNumbers(validBlockNumbers);
    return this.findHighestBlockNumber(validBlockNumbers);
  }

  public async getBlockTimestamp(blockNumber: number): Promise<number> {
    await this.init();
    const blocks = await this.fetchBlocksFromNodes(blockNumber);
    const validBlocks = this.extractValidBlocks(blocks);
    this.ensureValidBlocks(validBlocks);
    const block = validBlocks[0]; // Take the first valid block
    return block.timestamp;
  }

  public async callViewFunction(
      contractAddress: string,
      abi: string,
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

  private fetchBlocksFromNodes(blockNumber: number): Promise<(Block | null)[]> {
    const blocksPromises = this.nodes.map((node) =>
      node.getBlock(blockNumber).catch(() => null),
    );
    return Promise.all(blocksPromises);
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

  private extractValidBlocks(blocks: (Block | null)[]): Block[] {
    return blocks.filter((block): block is Block => block !== null);
  }

  private ensureValidBlockNumbers(validBlockNumbers: number[]): void {
    if (validBlockNumbers.length === 0) {
      this.logger.error('All nodes failed to retrieve block number');
      throw new BlockchainReaderError('All nodes failed to retrieve block number');
    }
  }

  private ensureValidBlocks(validBlocks: Block[]): void {
    if (validBlocks.length === 0) {
      this.logger.error('All nodes failed to retrieve blocks');
      throw new BlockchainReaderError('All nodes failed to retrieve blocks');
    }
  }

  private findHighestBlockNumber(blockNumbers: number[]): number {
    return Math.max(...blockNumbers);
  }

  private async fetchNodeResponses(
      contractAddress: string,
      abi: string,
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
    const proxyInfoPromises = this.nodes.map(async (node) =>
      await node.getProxyInfoForAddress(proxyAddress).catch(() => null),
    );
    const res: BlockchainNodeProxyInfo[] = await Promise.all(proxyInfoPromises) as BlockchainNodeProxyInfo[];
    return res;
  }
}
