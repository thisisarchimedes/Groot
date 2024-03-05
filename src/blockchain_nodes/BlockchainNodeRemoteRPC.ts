import Web3, {AbiItem} from 'web3';

import { BlockchainNode } from './BlockchainNode';
import { Logger } from '../service/Logger';

export class BlockchainNodeRemoteRPC implements BlockchainNode {
    private readonly web3: Web3;
  
    private readonly remoteRpcUrl: string;
    private readonly nodeName: string;
  
    constructor(remoteRpcUrl: string, nodeName: string) {
      this.remoteRpcUrl = remoteRpcUrl;
      this.web3 = new Web3(remoteRpcUrl);
      this.nodeName = nodeName;
    }
  
    public async startNode(): Promise<void> {
        // Do nothing, as this is a remote node
    }
  
    public async stopNode(): Promise<void> {
        // Do nothing, as this is a remote node
    }
  
    public async resetNode(externalProviderRpcUrl: string): Promise<void> {
        // Do nothing, as this is a remote node
    }
  
    public getBlockNumber(): Promise<bigint> {
      return this.web3.eth.getBlockNumber();
    }
  
    public async callViewFunction(
        contractAddress: string,
        abi: AbiItem[],
        functionName: string,
        params: any[] = [],
    ): Promise<any> {
      const contract = new this.web3.eth.Contract(abi, contractAddress);
  
      try {
        const data = await contract.methods[functionName](...params).call();
        return data;
      } catch (error) {
        Logger.error(`Error calling view function ${functionName}: ${error}`);
        throw error;
      }
    }
}
