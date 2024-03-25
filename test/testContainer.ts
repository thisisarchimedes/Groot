
import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../src/inversify.types';
import { IBlockchainReader } from '../src/blockchain/blockchain_reader/interfaces/IBlockchainReader';
import { BlockchainReader } from '../src/blockchain/blockchain_reader/BlockchainReader';
import { LoggerAdapter } from './unit/adapters/LoggerAdapter';
import { BlockchainNodeAdapter } from './unit/adapters/BlockchainNodeAdapter';
import { AbiStorageAdapter } from './unit/adapters/AbiStorageAdapter';
import { AbiFetcherAdapter } from './unit/adapters/AbiFetcherAdapter';
import { BlockchainNodeHealthMonitor } from '../src/service/health_monitor/BlockchainNodeHealthMonitor';
// Import other dependencies and adapters...

// Function to setup and return a new test container
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

    container.bind<IBlockchainNodeHealthMonitor>(TYPES.IBlockchainNodeHealthMonitor).to(BlockchainNodeHealthMonitor).inSingletonScope();


    // Binding the BlockchainReader
    container.bind<IBlockchainReader>(TYPES.IBlockchainReader).to(BlockchainReader).inSingletonScope();
    container.bind<AbiStorageAdapter>(AbiStorageAdapter).toSelf().inSingletonScope();
    container.bind<AbiFetcherAdapter>(AbiFetcherAdapter).toSelf().inSingletonScope();

    return container;
};