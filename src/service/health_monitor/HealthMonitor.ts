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
    for (const node of unhealthyNodes) {
      this.logger.warn(`Node ${node.getNodeName()} is unhealthy. Attempting to recover it...`);
      // Do in parrallel
      // if all nodes cannot recover throw
      await node.recoverNode();
      this.logger.info(`Node ${node.getNodeName()} has been recovered.`);
    }
  }
}
