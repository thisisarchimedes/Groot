import Docker from 'dockerode';

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
        console.log(`Port bindings have changed. Updating container ${this.instanceName}...`);
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
        console.log(`Stopping container ${this.instanceName}...`);
        await this.removeContainer();
        console.log(`Container ${this.instanceName} has been stopped.`);
      } else {
        console.log(`Container ${this.instanceName} is not running.`);
      }
    } catch (error) {
      if (error.statusCode === 404) {
        console.log(`Container ${this.instanceName} does not exist.`);
      } else {
        console.error(`Error stopping container ${this.instanceName}:`, error);
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
      console.log(`Starting existing container ${this.instanceName}...`);
      await container.start();
      console.log(`Container ${this.instanceName} started.`);
    } else {
      console.log(`Container ${this.instanceName} is already running.`);
    }
  }

  private async createAndStartContainer() {
    console.log(`External Port: ${this.portExternal}, Internal Port: ${this.portInternal}`);

    console.log(`Creating container ${this.instanceName}...`);
    const container = await this.docker.createContainer({
      Image: this.imageName,
      name: this.instanceName,
      ExposedPorts: {[`${this.portInternal}/tcp`]: {}}, // Expose the internal port of the container
      HostConfig: {
        PortBindings: {[`${this.portInternal}/tcp`]: [{HostPort: `${this.portExternal.toString()}`}]}, // Map the internal port to an external port on the host
      },
    });

    await container.start();
    console.log(`Container ${this.instanceName} created with ports ${this.portExternal}:${this.portInternal}.`);
  }
}
