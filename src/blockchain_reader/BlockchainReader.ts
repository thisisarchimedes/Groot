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
      abi: unknown[],
      functionName: string,
      params: unknown[] = [],
  ): Promise<unknown> {
    const functionCalls = this.nodes.map((node) => node.callViewFunction(contractAddress, abi, functionName, params));
    const blockNumbers = this.nodes.map((node) => node.getBlockNumber());

    const responses = await Promise.all(functionCalls);
    const blocks = await Promise.all(blockNumbers);

    const highestBlockNumberIndex = blocks.reduce((highestIndex, currentBlock, currentIndex, array) =>
            currentBlock > array[highestIndex] ? currentIndex : highestIndex, 0);

    return responses[highestBlockNumberIndex];
  }
}
