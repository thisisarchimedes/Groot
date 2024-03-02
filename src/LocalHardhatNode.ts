import { Web3 } from 'web3';

export class LocalHardhatNode {
    private readonly web3: Web3;

    constructor(rpc_url: string) {
        this.web3 = new Web3(rpc_url);
    }

    public async getBlockNumber(): Promise<bigint> {
        let blockNumber: Promise<bigint>;
        
        blockNumber = this.web3.eth.getBlockNumber();
        
        return blockNumber;
    }
}
