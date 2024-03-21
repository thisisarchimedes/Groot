import { IBlockchainNode } from '../../blockchain/blockchain_nodes/interfaces/IBlockchainNode';
import { ILogger } from '../logger/interfaces/ILogger';

export class BlockchainNodeHealthMonitor {
  constructor(private readonly logger: ILogger, private readonly nodes: IBlockchainNode[]) { }

  public async checkBlockchainNodesHealth(): Promise<void> {
    const unhealthyNodes = this.getUnhealthyNodes();
    if (unhealthyNodes.length === 0) {
      return;
    }

    const recoveryResults = await this.recoverNodesInParallel(unhealthyNodes);
    const failedRecoveries = this.getFailedRecoveries(recoveryResults);

    if (this.allNodesFailedToRecover(failedRecoveries, unhealthyNodes)) {
      this.logAllNodesDownError();
      throw new ErrorBlockchainNodeHealthMonitor('Blockchain Nodes Health Monitor:Nodes are down, none recovered');
    }
  }

  private getUnhealthyNodes(): IBlockchainNode[] {
    return this.nodes.filter((node) => !node.isHealthy());
  }

  private recoverNodesInParallel(unhealthyNodes: IBlockchainNode[]): Promise<PromiseSettledResult<boolean>[]> {
    return Promise.allSettled(
      unhealthyNodes.map((node) => {
        this.logAttemptingNodeRecovery(node);
        return this.recoverNodeWithErrorHandling(node);
      }),
    );
  }

  private logAttemptingNodeRecovery(node: IBlockchainNode): void {
    this.logger.warn(`Node ${node.getNodeName()} is unhealthy. Attempting to recover it...`);
  }

  private async recoverNodeWithErrorHandling(node: IBlockchainNode): Promise<boolean> {
    try {
      await node.recoverNode();
      this.logNodeRecoverySuccess(node);
      return true;
    } catch (error) {
      this.logNodeRecoveryFailure(node, error);
      return false;
    }
  }

  private getFailedRecoveries(recoveryResults: PromiseSettledResult<boolean>[]): PromiseSettledResult<boolean>[] {
    return recoveryResults.filter((result) => result.status === 'rejected' || result.value === false);
  }

  private allNodesFailedToRecover(
    failedRecoveries: PromiseSettledResult<boolean>[],
    unhealthyNodes: IBlockchainNode[],
  ): boolean {
    return failedRecoveries.length === unhealthyNodes.length;
  }

  private logNodeRecoverySuccess(node: IBlockchainNode): void {
    this.logger.info(`Node ${node.getNodeName()} has been recovered.`);
  }

  private logNodeRecoveryFailure(node: IBlockchainNode, error: unknown): void {
    this.logger.error(`Blockchain Nodes Health Monitor failed to recover node ${node.getNodeName()}: ${error}`);
  }

  private logAllNodesDownError(): void {
    this.logger.error('Blockchain Nodes Monitor: All nodes are down and failed to recover');
  }
}

export class ErrorBlockchainNodeHealthMonitor extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ErrorHealthMonitor';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
