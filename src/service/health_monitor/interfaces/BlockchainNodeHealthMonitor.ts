interface IBlockchainNodeHealthMonitor {
    checkBlockchainNodesHealth(): Promise<void>;
}