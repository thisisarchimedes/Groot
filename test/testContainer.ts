
import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../src/inversify.types';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { LoggerAdapter } from './adapters/LoggerAdapter';
// Import other dependencies and adapters...

// Function to setup and return a new test container
export const createTestContainer = (): Container => {
    const container = new Container();

    // Bindings for the test environment
    container.bind<LoggerAdapter>(TYPES.ILoggerAll).to(LoggerAdapter).inSingletonScope();

    container.bind<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain).toDynamicValue(() => {
        const logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
        return new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    }).inSingletonScope();

    container.bind<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt).toDynamicValue(() => {
        const logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
        return new BlockchainNodeAdapter(logger, 'localNodeInfura');
    }).inSingletonScope();

    // Add more bindings as needed for your tests...

    return container;
};