import { LocalNode } from "./LocalNode";

export class BlockchainReader {
    private readonly nodes: LocalNode[];
    
    constructor(nodes: LocalNode[]) {
        this.nodes = nodes;
    }
    
    public async getBlockNumber(): Promise<number> {
        const blockNumbers = await Promise.all(this.nodes.map((node) => node.getBlockNumber()));
        return Number(blockNumbers.reduce((max, current) => (current > max ? current : max), BigInt(0)));
    }
}