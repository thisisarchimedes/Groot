import {BlockchainNode} from '../../blockchain/blockchain_nodes/BlockchainNode';
import {Logger} from '../logger/Logger';

export class HealthMonitor {
  private readonly nodes: BlockchainNode[];
  private readonly logger: Logger;

  constructor(logger: Logger, nodes: BlockchainNode[]) {
    this.nodes = nodes;
    this.logger = logger;
  }

  public async checkBlockchainNodesHealth(): Promise<void> {
    const unhealthyNodes = this.nodes.filter((node) => !node.isHealthy());

    if (unhealthyNodes.length === 0) {
      return;
    }

    const recoveryResults = await Promise.allSettled(
        unhealthyNodes.map(async (node) => {
          this.logger.warn(`Node ${node.getNodeName()} is unhealthy. Attempting to recover it...`);
          try {
            await node.recoverNode();
            this.logger.info(`Node ${node.getNodeName()} has been recovered.`);
            return true;
          } catch (error) {
            this.logger.error(`Health Monitor failed to recover node ${node.getNodeName()}: ${error}`);
            return false;
          }
        }),
    );

    const failedRecoveries = recoveryResults.filter(
        (result) => result.status === 'rejected' || result.value === false,
    );

    if (failedRecoveries.length === unhealthyNodes.length) {
      this.logger.error('Health Monitor: All nodes are down and failed to recover');
      throw new Error('Health Monitor: All nodes are down and failed to recover');
    }
  }
}
