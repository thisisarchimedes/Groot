import { Web3 } from 'web3';
import Docker from 'dockerode';

export class LocalHardhatNode {
    private web3: Web3;
    private rpcUrl: string;

    constructor(rpc_url: string) {
        this.rpcUrl = rpc_url;
        this.web3 = new Web3(rpc_url);
    }

    public async getBlockNumber(): Promise<bigint> {
        let blockNumber: Promise<bigint>;
        
        blockNumber = this.web3.eth.getBlockNumber();
        
        return blockNumber;
    }

    public async launchNodeContainer(hostPort = 8545, containerPort = 8545) {
        const imageName = 'archimedes-node:latest';
        const containerName = 'archimedes-node-alchemy';
        const docker = new Docker({socketPath: '/var/run/docker.sock'});

        let container;
        try {
            // Attempt to get the container if it already exists
            container = docker.getContainer(containerName);
            const containerInfo = await container.inspect();
            
            // If the container exists but is not running, start it
            if (!containerInfo.State.Running) {
                console.log(`Starting existing container ${containerName}...`);
                await container.start();
                console.log(`Container ${containerName} started successfully.`);
            } else {
                console.log(`Container ${containerName} is already running.`);
            }
        } catch (error) {
            // If the container does not exist, create and start a new one
            if (error.statusCode === 404) {
                console.log(`Container ${containerName} does not exist. Creating a new one...`);
                try {
                    container = await docker.createContainer({
                        Image: imageName,
                        name: containerName,
                        ExposedPorts: {
                            [`${containerPort}/tcp`]: {}
                        },
                        HostConfig: {
                            PortBindings: {
                                [`${containerPort}/tcp`]: [{ HostPort: `${hostPort.toString()}` }]
                            }
                        },
                    });
    
                    await container.start();
                    console.log(`Container ${containerName} created and started successfully with port mapping ${hostPort}:${containerPort}`);
                } catch (creationError) {
                    console.error('Error creating and starting new container:', creationError);
                }
            } else {
                // Handle other errors
                console.error('Error checking for existing container:', error);
            }
        }
    }

    public async waitForContainerToBeReady(maxAttempts = 5, interval = 3000) {
        let attempts = 0;
    
        const checkReady = async () => {
            try {
                // Attempt to get the current block number
                const blockNumber = await this.getBlockNumber();
                console.log(`Blockchain is ready. Current block number is ${blockNumber}.`);
                return true; // If successful, the container is ready
            } catch (error) {
                console.log(`Waiting for blockchain to be ready... Attempt ${attempts + 1}/${maxAttempts}`);
                attempts++;
                if (attempts < maxAttempts) {
                    // If we have not exceeded max attempts, wait and try again
                    await new Promise(resolve => setTimeout(resolve, interval));
                    return checkReady();
                } else {
                    // Max attempts reached, throw an error
                    throw new Error('Blockchain node is not ready after maximum attempts.');
                }
            }
        };
    
        await checkReady();
    }
    
}
