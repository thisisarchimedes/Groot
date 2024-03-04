import {LocalNode} from './LocalNode';

export class BlockchainReader {
  private readonly nodes: LocalNode[];

  constructor(nodes: LocalNode[]) {
    this.nodes = nodes;
  }

  public async getBlockNumber(): Promise<number> {
    const blockNumbers = await Promise.all(this.nodes.map((node) => node.getBlockNumber()));
    return Number(blockNumbers.reduce((max, current) => (current > max ? current : max), BigInt(0)));
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  public async callViewFunction(
      contractAddress: string,
      abi: any[],
      functionName: string,
      params: any[] = [],
  ): Promise<any> {
    const functionCalls = this.nodes.map((node) => node.callViewFunction(contractAddress, abi, functionName, params));
    const blockNumbers = this.nodes.map((node) => node.getBlockNumber());

    const responses = await Promise.all(functionCalls);
    const blocks = await Promise.all(blockNumbers);

    const highestBlockNumberIndex = blocks.reduce((highestIndex, currentBlock, currentIndex, array) =>
        currentBlock > array[highestIndex] ? currentIndex : highestIndex, 0);

    return responses[highestBlockNumberIndex];
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
