
import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../src/inversify.types';
import { IBlockchainReader } from '../../src/blockchain/blockchain_reader/interfaces/IBlockchainReader';
import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { AbiStorageAdapter } from './adapters/AbiStorageAdapter';
import { AbiFetcherAdapter } from './adapters/AbiFetcherAdapter';
import { BlockchainNodeHealthMonitor } from '../../src/service/health_monitor/BlockchainNodeHealthMonitor';
import { ConfigServiceAdapter } from './adapters/ConfigServiceAdapter';
import { IAbiStorage } from '../../src/rule_engine/tool/abi_repository/interfaces/IAbiStorage';
import { AbiStorageDynamoDB } from '../../src/rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import { AbiRepoAdapter } from './adapters/AbiRepoAdapter';
import { TxQueueAdapter } from './adapters/TxQueueAdapter';
import { IBlockchainNodeHealthMonitor } from '../../src/service/health_monitor/interfaces/BlockchainNodeHealthMonitor';
import { IAbiRepo } from '../../src/rule_engine/tool/abi_repository/interfaces/IAbiRepo';

export const createTestContainer = (): Container => {
    const container = new Container();


    // Binding logger
    container.bind<LoggerAdapter>(TYPES.ILoggerAll).to(LoggerAdapter).inSingletonScope();

    // Binding the BlockchainNode with the adapter for testing
    container.bind<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain).toDynamicValue(() => {
        const logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
        return new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    }).inSingletonScope();

    container.bind<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt).toDynamicValue(() => {
        const logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
        return new BlockchainNodeAdapter(logger, 'localNodeInfura');
    }).inSingletonScope();

    container.bind<IBlockchainNodeHealthMonitor>(TYPES.IBlockchainNodeHealthMonitor)
        .to(BlockchainNodeHealthMonitor).inSingletonScope();

    // Binding the BlockchainReader
    container.bind<IBlockchainReader>(TYPES.IBlockchainReader).to(BlockchainReader).inSingletonScope();
    container.bind<AbiStorageAdapter>(AbiStorageAdapter).toSelf().inSingletonScope();
    container.bind<TxQueueAdapter>(TxQueueAdapter).toSelf().inSingletonScope();


    container.bind<AbiFetcherAdapter>(AbiFetcherAdapter).toSelf().inSingletonScope();
    container.bind<IAbiRepo>(TYPES.IAbiRepo).to(AbiRepoAdapter).inRequestScope();

    container.bind<IAbiStorage>(TYPES.IAbiStorageDynamoDB).to(AbiStorageDynamoDB).inRequestScope();

    container.bind<ConfigServiceAdapter>(ConfigServiceAdapter).toSelf().inSingletonScope();

    return container;
};
