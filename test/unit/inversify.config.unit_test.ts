
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
import { RuleEngine } from '../../src/rule_engine/RuleEngine';
import { IRuleEngine } from '../../src/rule_engine/interfaces/IRuleEngine';
import { FactoryRule } from '../../src/rule_engine/FactoryRule';
import { IFactoryRule } from '../../src/rule_engine/interfaces/IFactoryRule';
import { Rule } from '../../src/rule_engine/rule/Rule';
import { TypeRule } from '../../src/rule_engine/TypesRule';
import { RuleDummy } from '../../src/rule_engine/rule/RuleDummy';
import { RuleExpirePositions } from '../../src/rule_engine/rule/RuleExpirePositions';
import { RuleBalanceCurvePoolWithVault } from '../../src/rule_engine/rule/RuleBalanceCurvePoolWithVault';
import { RuleUniswapPSPRebalance } from '../../src/rule_engine/rule/RuleUniswapPSPRebalance';
import PostgreDataSource from '../../src/rule_engine/tool/data_source/PostgreDataSource';
import { ILoggerAll } from '../../src/service/logger/interfaces/ILoggerAll';
import { ConfigService } from '../../src/service/config/ConfigService';
import DBService from '../../src/service/db/dbService';

export const createTestContainer = (): Container => {
    const container = new Container();

    // Binding logger
    container.bind<LoggerAdapter>(LoggerAdapter).toSelf().inSingletonScope();

    const loggerAdapter = container.resolve(LoggerAdapter);

    container.bind<ILoggerAll>(TYPES.ILoggerAll).toConstantValue(loggerAdapter);

    // Binding the BlockchainNode with the adapter for testing
    container.bind<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain).toDynamicValue(() => {
        const logger = container.resolve(LoggerAdapter);
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


    container.bind<IFactoryRule>(TYPES.IFactoryRule).to(FactoryRule).inSingletonScope();

    container.bind<IRuleEngine>(TYPES.IRuleEngine).to(RuleEngine).inSingletonScope();

    container.bind<AbiFetcherAdapter>(AbiFetcherAdapter).toSelf().inSingletonScope();
    container.bind<IAbiRepo>(TYPES.IAbiRepo).to(AbiRepoAdapter).inRequestScope();

    container.bind<IAbiStorage>(TYPES.IAbiStorageDynamoDB).to(AbiStorageDynamoDB).inRequestScope();

    container.bind<Rule>(TypeRule.Dummy).to(RuleDummy).inRequestScope();
    container.bind<Rule>(TypeRule.ExpirePositions).to(RuleExpirePositions).inRequestScope();
    container.bind<Rule>(TypeRule.UniswapPSPRebalance).to(RuleUniswapPSPRebalance).inRequestScope();
    container.bind<Rule>(TypeRule.RuleBalanceCurvePoolWithVault)
        .to(RuleBalanceCurvePoolWithVault).inRequestScope();

    container.bind<ConfigServiceAdapter>(ConfigServiceAdapter).toSelf().inSingletonScope();

    container.bind<ConfigService>(TYPES.ConfigServiceAWS).to(ConfigServiceAdapter).inSingletonScope();

    container.bind<PostgreDataSource>(TYPES.PostgreDataSource).to(PostgreDataSource).inRequestScope();

    container.bind<DBService>(TYPES.DBService).to(DBService).inRequestScope();

    container.bind<Container>(Container).toConstantValue(container);

    return container;
};
