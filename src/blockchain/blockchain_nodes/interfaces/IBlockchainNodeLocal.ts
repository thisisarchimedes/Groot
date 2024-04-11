import {IBlockchainNode} from './IBlockchainNode';

export interface IBlockchainNodeLocal extends IBlockchainNode {
    startNode(): Promise<void>;
    stopNode(): Promise<void>;
    recoverNode(): Promise<void>;
    resetNode(externalProviderRpcUrl: string): Promise<void>;
}
