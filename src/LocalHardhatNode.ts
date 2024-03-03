import Web3 from 'web3';
import Docker from 'dockerode';

export class LocalHardhatNode {
    private readonly web3: Web3;
    private readonly docker: Docker = new Docker({ socketPath: '/var/run/docker.sock' });
    private readonly rpcUrl: string;
    private readonly containerPort: number;
    private readonly imageName: string;
    private readonly containerName: string;

    constructor(port: number, imageName: string, containerName: string) {
        this.rpcUrl = `http://127.0.0.1:${port}`;
        this.web3 = new Web3(this.rpcUrl);
        this.containerPort = port;
        this.imageName = imageName;
        this.containerName = containerName;
    }

    public async getBlockNumber(): Promise<bigint> {
        return this.web3.eth.getBlockNumber();
    }

    public async startNodeContainer() {
        const containerExists = await this.checkContainerExists();
        if (containerExists) {
            await this.ensureContainerStarted();
        } else {
            await this.createAndStartContainer();
        }
    }

    private async checkContainerExists(): Promise<boolean> {
        try {
            const container = this.docker.getContainer(this.containerName);
            await container.inspect();
            return true;
        } catch (error) {
            return false;
        }
    }

    private async ensureContainerStarted() {
        const container = this.docker.getContainer(this.containerName);
        const info = await container.inspect();
        if (!info.State.Running) {
            console.log(`Starting existing container ${this.containerName}...`);
            await container.start();
            console.log(`Container ${this.containerName} started.`);
        } else {
            console.log(`Container ${this.containerName} is already running.`);
        }
    }

    private async createAndStartContainer() {
        console.log(`Creating container ${this.containerName}...`);
        const container = await this.docker.createContainer({
            Image: this.imageName,
            name: this.containerName,
            ExposedPorts: { [`${this.containerPort}/tcp`]: {} },
            HostConfig: {
                PortBindings: { [`${this.containerPort}/tcp`]: [{ HostPort: `${this.containerPort.toString()}` }] }
            },
        });

        await container.start();
        console.log(`Container ${this.containerName} created and started with port mapping ${this.containerPort}:${this.containerPort}.`);
    }

    public async waitForContainerToBeReady(maxAttempts = 8, interval = 3000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const blockNumber = await this.getBlockNumber();
                console.log(`Blockchain is ready. Current block number is ${blockNumber}.`);
                return;
            } catch (error) {
                console.log(`Waiting for blockchain to be ready... Attempt ${attempt}/${maxAttempts}`);
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
        throw new Error('Blockchain node is not ready after maximum attempts.');
    }
}
