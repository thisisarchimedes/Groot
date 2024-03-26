// InversifyConfig.ts
import 'reflect-metadata';
import {Container, interfaces} from 'inversify';
import {LoggerAll} from './service/logger/LoggerAll';
import {IConfigServiceAWS} from './service/config/interfaces/IConfigServiceAWS';
import {ILoggerAll} from './service/logger/interfaces/ILoggerAll';
import {Groot} from './Groot';
import {TYPES} from './inversify.types';
import {BlockchainNodeLocal} from './blockchain/blockchain_nodes/BlockchainNodeLocal';
import {IBlockchainNodeLocal} from './blockchain/blockchain_nodes/interfaces/IBlockchainNodeLocal';
import {IBlockchainReader} from './blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {BlockchainReader} from './blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeHealthMonitor} from './service/health_monitor/BlockchainNodeHealthMonitor';
import {IHostNameProvider} from './service/health_monitor/IHostNameProvider';
import {HostNameProvider} from './service/health_monitor/HostNameProvider';
import {ISignalHeartbeat} from './service/health_monitor/signal/interfaces/ISignalHeartbeat';
import {SignalAWSHeartbeat} from './service/health_monitor/signal/SignalAWSHeartbeat';
import {ISignalCriticalFailure} from './service/health_monitor/signal/interfaces/ISignalCriticalFailure';
import {SignalAWSCriticalFailure} from './service/health_monitor/signal/SignalAWSCriticalFailure';
import {HealthMonitor} from './service/health_monitor/HealthMonitor';
import {IAbiStorage} from './rule_engine/tool/abi_repository/interfaces/IAbiStorage';
import {AbiStorageDynamoDB} from './rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import {IAbiFetcher} from './rule_engine/tool/abi_repository/interfaces/IAbiFetcher';
import {AbiFetcherEtherscan} from './rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {AbiRepo} from './rule_engine/tool/abi_repository/AbiRepo';
import {IFactoryRule} from './rule_engine/interfaces/IFactoryRule';
import {FactoryRule} from './rule_engine/FactoryRule';
import {IRuleEngine} from './rule_engine/interfaces/IRuleEngine';
import {RuleEngine} from './rule_engine/RuleEngine';
import {IGroot} from './interfaces/IGroot';
import {IBlockchainNodeHealthMonitor} from './service/health_monitor/interfaces/BlockchainNodeHealthMonitor';
import {IHealthMonitor} from './service/health_monitor/signal/interfaces/IHealthMonitor';
import {IAbiRepo} from './rule_engine/tool/abi_repository/interfaces/IAbiRepo';

export class InversifyConfig {
  private container: Container;

  constructor(configServiceAWS: IConfigServiceAWS) {
    this.container = new Container();

    this.container.bind<string>(TYPES.MainLocalNodeURI)
        .toConstantValue(`http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`);

    this.container.bind<string>(TYPES.AltLocalNodeURI)
        .toConstantValue(`http://localhost:${process.env.ALT_LOCAL_NODE_PORT || 18545}`);

    this.container.bind<string>(TYPES.ServiceName).toConstantValue('Groot');

    this.container.bind<string>(TYPES.MetricNamespaceHeartBeat).toConstantValue('Heartbeat');
    this.container.bind<string>(TYPES.MetricNamespaceCriticalFailure).toConstantValue('CriticalFailure');

    this.container.bind<string>(TYPES.AlchemyNodeLabel).toConstantValue('alchemy-node');

    this.container.bind<string>(TYPES.InfuraNodeLabel).toConstantValue('infura-node');

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
          return new BlockchainNodeLocal(logger, altRpcUrl, 'infura-node');
        }).inSingletonScope();


    this.container.bind<IBlockchainReader>(TYPES.IBlockchainReader).to(BlockchainReader).inSingletonScope();

    this.container.bind<IBlockchainNodeHealthMonitor>(TYPES.IBlockchainNodeHealthMonitor)
        .to(BlockchainNodeHealthMonitor).inRequestScope();

    this.container.bind<IHostNameProvider>(TYPES.IHostNameProvider).to(HostNameProvider).inRequestScope();

    this.container.bind<ISignalHeartbeat>(TYPES.ISignalHeartbeat).to(SignalAWSHeartbeat).inRequestScope();

    this.container.bind<ISignalCriticalFailure>(TYPES.ISignalCriticalFailure)
        .to(SignalAWSCriticalFailure).inRequestScope();

    this.container.bind<IHealthMonitor>(TYPES.IHealthMonitor).to(HealthMonitor).inRequestScope();

    this.container.bind<IAbiStorage>(TYPES.IAbiStorageDynamoDB).to(AbiStorageDynamoDB).inRequestScope();

    this.container.bind<IAbiFetcher>(TYPES.IAbiFetcherEtherScan).to(AbiFetcherEtherscan).inRequestScope();

    this.container.bind<IAbiRepo>(TYPES.IAbiRepo).to(AbiRepo).inRequestScope();

    this.container.bind<IFactoryRule>(TYPES.IFactoryRule).to(FactoryRule).inRequestScope();

    this.container.bind<IRuleEngine>(TYPES.IRuleEngine).to(RuleEngine).inRequestScope();

    this.container.bind<IGroot>(TYPES.Groot).to(Groot).inSingletonScope();
  }

  public getContainer(): Container {
    return this.container;
  }
}
