// InversifyConfig.ts
import 'reflect-metadata';
import { Container, interfaces } from 'inversify';
import { LoggerAll } from './service/logger/LoggerAll';
import { IConfigServiceAWS } from './service/config/interfaces/IConfigServiceAWS';
import { ILoggerAll } from './service/logger/interfaces/ILoggerAll';
import { Groot } from './Groot';
import { TYPES } from './inversify.types';
import { BlockchainNodeLocal } from './blockchain/blockchain_nodes/BlockchainNodeLocal';
import { IBlockchainNodeLocal } from './blockchain/blockchain_nodes/interfaces/IBlockchainNodeLocal';
import { IBlockchainReader } from './blockchain/blockchain_reader/interfaces/IBlockchainReader';
import { BlockchainReader } from './blockchain/blockchain_reader/BlockchainReader';

export class InversifyConfig {
    private container: Container;

    constructor(configServiceAWS: IConfigServiceAWS) {
        this.container = new Container();

        this.container.bind<string>(TYPES.MainLocalNodeURI)
            .toConstantValue(`http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`);

        this.container.bind<string>(TYPES.AltLocalNodeURI)
            .toConstantValue(`http://localhost:${process.env.ALT_LOCAL_NODE_PORT || 18545}`);

        this.container.bind<string>(TYPES.ServiceName).toConstantValue("Groot");

        this.container.bind<string>(TYPES.AlchemyNodeLabel).toConstantValue("alchemy-node");

        this.container.bind<string>(TYPES.InfuraNodeLabel).toConstantValue("infura-node");

        this.container.bind<IConfigServiceAWS>(TYPES.IConfigServiceAWS).toConstantValue(configServiceAWS);

        this.container.bind<ILoggerAll>(TYPES.ILoggerAll).to(LoggerAll).inSingletonScope();

        this.container.bind<IBlockchainNodeLocal>(TYPES.BlockchainNodeLocalMain)
            .toDynamicValue((context: interfaces.Context) => {
                const logger = context.container.get<ILoggerAll>(TYPES.ILoggerAll);
                const mainRpcUrl = context.container.get<string>(TYPES.MainLocalNodeURI);
                const alchemyNodeLabel = context.container.get<string>(TYPES.AlchemyNodeLabel);

                return new BlockchainNodeLocal(logger, mainRpcUrl, alchemyNodeLabel);
            }).inSingletonScope();

        this.container.bind<IBlockchainNodeLocal>(TYPES.BlockchainNodeLocalAlt)
            .toDynamicValue((context: interfaces.Context) => {
                const logger = context.container.get<ILoggerAll>(TYPES.ILoggerAll);
                const altRpcUrl = context.container.get<string>(TYPES.AltLocalNodeURI);
                return new BlockchainNodeLocal(logger, altRpcUrl, "infura-node");
            }).inSingletonScope();


        this.container.bind<IBlockchainReader>(TYPES.IBlockchainReader).to(BlockchainReader).inSingletonScope();

        this.container.bind<IGroot>(TYPES.Groot).to(Groot).inSingletonScope();
    }

    public getContainer(): Container {
        return this.container;
    }
}
