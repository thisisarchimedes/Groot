import Web3 from 'web3';

import {BlockchainNode} from './BlockchainNode';
import {Logger} from '../../service/logger/Logger';

export class BlockchainNodeRemoteRPC extends BlockchainNode {
  private readonly remoteRpcUrl: string;
  private readonly SLEEP_DURATION_WHEN_RECOVERING_NODE = 10000;

  constructor(logger: Logger, remoteRpcUrl: string, nodeName: string) {
    super(logger, nodeName);

    this.remoteRpcUrl = remoteRpcUrl;
    this.web3 = new Web3(remoteRpcUrl);
  }

  public async startNode(): Promise<void> {
    // Do nothing, as this is a remote node
  }

  public async stopNode(): Promise<void> {
    // Do nothing, as this is a remote node
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async resetNode(externalProviderRpcUrl: string): Promise<void> {
    // Do nothing, as this is a remote node
  }

  public async recoverNode(): Promise<void> {
    this.logger.info('Trying to recover node...');
    await this.busySleep(this.SLEEP_DURATION_WHEN_RECOVERING_NODE);
    await this.getBlockNumber();
    this.logger.info('Node recovered successfully.');
    this.isNodeHealthy = true;
  }
}
