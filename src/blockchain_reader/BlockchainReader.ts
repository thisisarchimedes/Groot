import {AbiItem} from 'web3-types';
import {BlockchainNode} from '../blockchain_nodes/BlockchainNode';

export class BlockchainReader {
  private readonly nodes: BlockchainNode[];

  constructor(nodes: BlockchainNode[]) {
    this.nodes = nodes;
  }

  public async getBlockNumber(): Promise<number> {
    const blockNumbers = await Promise.all(this.nodes.map((node) => node.getBlockNumber()));
    return Number(blockNumbers.reduce((max, current) => (current > max ? current : max), 0));
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
      throw new Error('All nodes failed to execute callViewFunction or getBlockNumber');
    }

    return this.getVaildResponseFromNodeWithHighestBlockNumber(validNodeResponses);
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
      response: result.status === 'fulfilled' ? result.value : null,
      blockNumber: settledBlockNumbers[index].status === 'fulfilled' ? settledBlockNumbers[index].value : null,
    }));
  }

  private filterValidNodeResponses(nodeResponses: NodeResponse[]): ValidNodeResponse[] {
    return nodeResponses.filter(
        (nodeResponse): nodeResponse is ValidNodeResponse =>
          nodeResponse.response !== null && nodeResponse.blockNumber !== null,
    );
  }

  private getVaildResponseFromNodeWithHighestBlockNumber(validNodeResponses: ValidNodeResponse[]): unknown {
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
