export interface IBlockchainNodeHealthMonitor {
    checkBlockchainNodesHealth(): Promise<void>;
}
