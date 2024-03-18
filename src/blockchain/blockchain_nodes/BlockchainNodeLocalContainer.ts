import {DockerOperator} from '../blockchain_reader/DockerOperator';
import {Logger} from '../../service/logger/Logger';
import {BlockchainNodeLocal} from './BlockchainNodeLocal';

export class BlockchainNodeLocalContainer extends BlockchainNodeLocal {
  private readonly dockerOperator: DockerOperator;
  private readonly nodePort: number;

  private readonly DEFAULT_HARDHAT_NODE_PORT = 8545;
  private readonly DEFAULT_HARDHAT_DOCKER_IMAGE_NAME = 'arch-production-node:latest';

  constructor(logger: Logger, externalPort: number, nodeName: string) {
    const localRpcUrl = `http://127.0.0.1:${externalPort}`;
    super(logger, localRpcUrl, nodeName);

    this.nodePort = externalPort;

    this.dockerOperator = new DockerOperator(logger,
        {
          portExternal: externalPort,
          portInternal: this.DEFAULT_HARDHAT_NODE_PORT,
          imageName: this.DEFAULT_HARDHAT_DOCKER_IMAGE_NAME,
          instanceName: nodeName,
        });
  }

  public async startNode(): Promise<void> {
    await this.dockerOperator.startContainer();
    await this.waitForNodeToBeReady();
  }

  public async stopNode(): Promise<void> {
    await this.dockerOperator.stopContainer();
  }
}
