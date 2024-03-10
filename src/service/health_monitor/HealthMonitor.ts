import {BlockchainNode} from '../../blockchain/blockchain_nodes/BlockchainNode';
import {Logger} from '../logger/Logger';

export class HealthMonitor {
  constructor(private readonly logger: Logger, private readonly nodes: BlockchainNode[]) {}

  public async checkBlockchainNodesHealth(): Promise<void> {
    const unhealthyNodes = this.getUnhealthyNodes();

    if (unhealthyNodes.length === 0) {
      return;
    }

    const recoveryResults = await this.recoverNodesInParallel(unhealthyNodes);
    const failedRecoveries = this.getFailedRecoveries(recoveryResults);

    if (this.allNodesFailedToRecover(failedRecoveries, unhealthyNodes)) {
      this.logAllNodesDownError();
      throw new ErrorHealthMonitor('Health Monitor: All nodes are down and failed to recover');
    }
  }

  private getUnhealthyNodes(): BlockchainNode[] {
    return this.nodes.filter((node) => !node.isHealthy());
  }

  private recoverNodesInParallel(unhealthyNodes: BlockchainNode[]): Promise<PromiseSettledResult<boolean>[]> {
    return Promise.allSettled(
        unhealthyNodes.map((node) => {
          this.logAttemptingNodeRecovery(node);
          return this.recoverNodeWithErrorHandling(node);
        }),
    );
  }

  private logAttemptingNodeRecovery(node: BlockchainNode): void {
    this.logger.warn(`Node ${node.getNodeName()} is unhealthy. Attempting to recover it...`);
  }

  private async recoverNodeWithErrorHandling(node: BlockchainNode): Promise<boolean> {
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
      unhealthyNodes: BlockchainNode[],
  ): boolean {
    return failedRecoveries.length === unhealthyNodes.length;
  }

  private logNodeRecoverySuccess(node: BlockchainNode): void {
    this.logger.info(`Node ${node.getNodeName()} has been recovered.`);
  }

  private logNodeRecoveryFailure(node: BlockchainNode, error: unknown): void {
    this.logger.error(`Health Monitor failed to recover node ${node.getNodeName()}: ${error}`);
  }

  private logAllNodesDownError(): void {
    this.logger.error('Health Monitor: All nodes are down and failed to recover');
  }
}

export class ErrorHealthMonitor extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ErrorHealthMonitor';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
