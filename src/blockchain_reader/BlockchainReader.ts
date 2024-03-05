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

const PROMISE_FULFILLED = 'fulfilled';

export class BlockchainReader {
  private readonly nodes: BlockchainNode[];

  constructor(nodes: BlockchainNode[]) {
    this.nodes = nodes;
  }

  public async getBlockNumber(): Promise<number> {
    const blockNumbers = await this.getAllBlockNumbers();
    const validBlockNumbers = this.filterValidBlockNumbers(blockNumbers);

    if (validBlockNumbers.length === 0) {
      Logger.error('All nodes failed to retrieve block number');
      throw new BlockChainReaderError('All nodes failed to retrieve block number');
    }

    return this.getHighestBlockNumber(validBlockNumbers);
  }

  public async callViewFunction(
      contractAddress: string,
      abi: AbiItem[],
      functionName: string,
      params: unknown[] = [],
  ): Promise<unknown> {
    const nodeResponses = await this.getAllNodeResponses(contractAddress, abi, functionName, params);
    const validNodeResponses = this.filterValidNodeResponses(nodeResponses);

    if (validNodeResponses.length === 0) {
      Logger.error('All nodes failed to retrieve block number');
      throw new BlockChainReaderError('All nodes failed to execute callViewFunction or getBlockNumber');
    }

    return this.getValidResponseFromNodeWithHighestBlockNumber(validNodeResponses);
  }

  private getAllBlockNumbers(): Promise<(number | null)[]> {
    const blockNumberPromises = this.nodes.map((node) =>
      node.getBlockNumber().catch(() => null),
    );

    return Promise.all(blockNumberPromises);
  }

  private filterValidBlockNumbers(blockNumbers: (number | null)[]): number[] {
    return blockNumbers.filter((blockNumber): blockNumber is number => blockNumber !== null);
  }

  private getHighestBlockNumber(blockNumbers: number[]): number {
    return Math.max(...blockNumbers);
  }

  private async getAllNodeResponses(
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
      response: result.status === PROMISE_FULFILLED ? result.value : null,
      blockNumber: settledBlockNumbers[index].status === PROMISE_FULFILLED ? settledBlockNumbers[index].value : null,
    }));
  }

  private filterValidNodeResponses(nodeResponses: NodeResponse[]): ValidNodeResponse[] {
    return nodeResponses.filter(
        (nodeResponse): nodeResponse is ValidNodeResponse =>
          nodeResponse.response !== null && nodeResponse.blockNumber !== null,
    );
  }

  private getValidResponseFromNodeWithHighestBlockNumber(validNodeResponses: ValidNodeResponse[]): unknown {
    const highestBlockNumberIndex = validNodeResponses.reduce(
        (highestIndex, currentNode, currentIndex) =>
        currentNode.blockNumber! > validNodeResponses[highestIndex].blockNumber! ? currentIndex : highestIndex,
        0,
    );

    return validNodeResponses[highestBlockNumberIndex].response;
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
