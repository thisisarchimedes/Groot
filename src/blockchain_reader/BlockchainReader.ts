import {AbiItem} from 'web3-types';
import {BlockchainNode} from '../blockchain_nodes/BlockchainNode';
import {Logger} from '../service/Logger';

export class BlockChainReaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockChainReaderError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BlockChainReaderError);
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
  constructor(private readonly nodes: BlockchainNode[]) {}

  public async getBlockNumber(): Promise<number> {
    const blockNumbers = await this.fetchBlockNumbersFromNodes();
    const validBlockNumbers = this.extractValidBlockNumbers(blockNumbers);
    this.ensureValidBlockNumbers(validBlockNumbers);
    return this.findHighestBlockNumber(validBlockNumbers);
  }

  public async callViewFunction(
      contractAddress: string,
      abi: AbiItem[],
      functionName: string,
      params: unknown[] = [],
  ): Promise<unknown> {
    const nodeResponses = await this.fetchNodeResponses(contractAddress, abi, functionName, params);
    const validNodeResponses = this.extractValidNodeResponses(nodeResponses);
    this.ensureValidNodeResponses(validNodeResponses);
    return this.findResponseFromNodeWithHighestBlockNumber(validNodeResponses);
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
      Logger.error('All nodes failed to retrieve block number');
      throw new BlockChainReaderError('All nodes failed to retrieve block number');
    }
  }

  private findHighestBlockNumber(blockNumbers: number[]): number {
    return Math.max(...blockNumbers);
  }

  private async fetchNodeResponses(
      contractAddress: string,
      abi: AbiItem[],
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
      Logger.error('All nodes failed to retrieve block number');
      throw new BlockChainReaderError('All nodes failed to execute callViewFunction or getBlockNumber');
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
}
