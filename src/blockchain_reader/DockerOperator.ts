import Docker from 'dockerode';
import {Logger} from '../service/Logger';

export interface DockerConfig {
  portExternal: number;
  portInternal: number;
  imageName: string;
  instanceName: string;
}

export class DockerOperator {
  private readonly docker: Docker = new Docker({socketPath: '/var/run/docker.sock'});
  private readonly portExternal: number;
  private readonly portInternal: number;
  private readonly imageName: string;
  private readonly instanceName: string;

  constructor(dockerConfig: DockerConfig) {
    this.portExternal = dockerConfig.portExternal;
    this.portInternal = dockerConfig.portInternal;
    this.imageName = dockerConfig.imageName;
    this.instanceName = dockerConfig.instanceName;
  }

  public async startContainer() {
    const containerExists = await this.checkContainerExists();
    if (containerExists) {
      const needsPortUpdate = await this.checkPortBindings();
      if (needsPortUpdate) {
        Logger.debug(`Port bindings have changed. Updating container ${this.instanceName}...`);
        await this.removeContainer();
        await this.createAndStartContainer();
      } else {
        await this.ensureContainerStarted();
      }
    } else {
      await this.createAndStartContainer();
    }
  }

  public async stopContainer() {
    try {
      const container = this.docker.getContainer(this.instanceName);
      const containerInfo = await container.inspect();

      if (containerInfo.State.Running) {
        Logger.debug(`Stopping container ${this.instanceName}...`);
        await this.removeContainer();
        Logger.debug(`Container ${this.instanceName} has been stopped.`);
      } else {
        Logger.debug(`Container ${this.instanceName} is not running.`);
      }
    } catch (error) {
      if (this.isDockerError(error) && error.statusCode === 404) {
        Logger.debug(`Container ${this.instanceName} does not exist.`);
      } else {
        Logger.error(`Error stopping container ${this.instanceName} - Error: ${error}`);
      }
    }
  }

  private async checkContainerExists(): Promise<boolean> {
    try {
      const container = this.docker.getContainer(this.instanceName);
      await container.inspect();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkPortBindings(): Promise<boolean> {
    const container = this.docker.getContainer(this.instanceName);
    const info = await container.inspect();
    const internalPortTcp = `${this.portInternal}/tcp`;
    const externalPortBinding = info.HostConfig.PortBindings?.[internalPortTcp]?.[0]?.HostPort;
    return externalPortBinding !== this.portExternal.toString();
  }

  private async removeContainer() {
    const container = this.docker.getContainer(this.instanceName);
    await container.stop();
    await container.remove();
  }

  private async ensureContainerStarted() {
    const container = this.docker.getContainer(this.instanceName);
    const info = await container.inspect();

    if (!info.State.Running) {
      Logger.debug(`Starting existing container ${this.instanceName}...`);
      await container.start();
      Logger.debug(`Container ${this.instanceName} started.`);
    } else {
      Logger.debug(`Container ${this.instanceName} is already running.`);
    }
  }

  private async createAndStartContainer() {
    Logger.debug(`External Port: ${this.portExternal}, Internal Port: ${this.portInternal}`);

    Logger.debug(`Creating container ${this.instanceName}...`);
    const container = await this.docker.createContainer({
      Image: this.imageName,
      name: this.instanceName,
      ExposedPorts: {[`${this.portInternal}/tcp`]: {}},
      HostConfig: {
        PortBindings: {[`${this.portInternal}/tcp`]: [{HostPort: `${this.portExternal.toString()}`}]},
      },
    });

    await container.start();
    Logger.debug(`Container ${this.instanceName} created with ports ${this.portExternal}:${this.portInternal}.`);
  }

  private isDockerError(error: unknown): error is { statusCode: number } {
    return typeof error === 'object' && error !== null && 'statusCode' in error;
  }
}
