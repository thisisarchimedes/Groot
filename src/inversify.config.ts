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
import {Client} from 'pg';
import {IConfigService} from './service/config/interfaces/IConfigService';
import {ILogger} from './service/logger/interfaces/ILogger';
import {ITxQueue} from './tx_queue/interfaces/ITxQueue';
import PostgreTxQueue from './tx_queue/PostgreTxQueue';
import {ITransactionQueuer} from './tx_queue/interfaces/ITransactionQueuer';
import {TransactionQueuer} from './tx_queue/TransactionQueuer';
import {ILeverageDataSource} from './rule_engine/tool/data_source/interfaces/ILeverageDataSource';
import PostgreDataSource from './rule_engine/tool/data_source/PostgreDataSource';
import {Rule} from './rule_engine/rule/Rule';
import {TypeRule} from './rule_engine/TypesRule';
import {RuleDummy} from './rule_engine/rule/RuleDummy';
import {RuleExpirePositions} from './rule_engine/rule/RuleExpirePositions';
import {RuleUniswapPSPRebalance} from './rule_engine/rule/RuleUniswapPSPRebalance';
import {LoggerConsole} from './service/logger/LoggerConsole';
import {RuleBalanceCurvePoolWithVault} from './rule_engine/rule/RuleBalanceCurvePoolWithVault';
import PositionLedgerContract from './rule_engine/tool/contracts/PositionLedgerContract';

export class InversifyConfig {
  private container: Container;

  constructor(configServiceAWS: IConfigServiceAWS) {
    this.container = new Container();

    this.bindDBConfiguration(configServiceAWS);
    this.bindConstants(configServiceAWS);
    this.bindLogging();
    this.bindBlockchainNodes();
    this.bindHealthMonitoring();
    this.bindAbiManagement();
    this.bindRuleEngine();
    this.bindTransactionQueue();
    this.bindRules();
    this.bindContracts();
    this.bindGroot();
  }

  private bindDBConfiguration(configServiceAWS: IConfigServiceAWS) {
    this.container.bind<Client>(TYPES.TransactionsDBClient).toDynamicValue(() => {
      const connectionString = configServiceAWS.getTransactionsDBURL();
      return new Client({
        connectionString: connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
      });
    }).inSingletonScope();

    this.container.bind<Client>(TYPES.LeverageDBClient).toDynamicValue(() => {
      const connectionString = configServiceAWS.getLeverageDBURL();
      return new Client({
        connectionString: connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
      });
    }).inSingletonScope();

    this.container.bind<ILeverageDataSource>(TYPES.ILeverageDataSource).to(PostgreDataSource).inTransientScope();
  }

  private bindConstants(configServiceAWS: IConfigServiceAWS) {
    this.container.bind<string>(TYPES.MainLocalNodeURI)
        .toConstantValue(`http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`);

    this.container.bind<string>(TYPES.AltLocalNodeURI)
        .toConstantValue(`http://localhost:${process.env.ALT_LOCAL_NODE_PORT || 18545}`);

    this.container.bind<string>(TYPES.ServiceName).toConstantValue('Groot');
    this.container.bind<string>(TYPES.MetricNamespaceHeartBeat).toConstantValue('Heartbeat');
    this.container.bind<string>(TYPES.MetricNamespaceCriticalFailure).toConstantValue('CriticalFailure');
    this.container.bind<string>(TYPES.AlchemyNodeLabel).toConstantValue('alchemy-node');
    this.container.bind<string>(TYPES.InfuraNodeLabel).toConstantValue('infura-node');

    this.container.bind<IConfigService>(TYPES.IConfigServiceAWS).toConstantValue(configServiceAWS);
  }

  private bindContracts() {
    this.container.bind<PositionLedgerContract>(PositionLedgerContract).toSelf();
  }

  private bindLogging() {
    this.container.bind<ILogger>(TYPES.ILoggerConsole).to(LoggerConsole).inSingletonScope();
    this.container.bind<ILogger>(TYPES.ILoggerAll).to(LoggerAll).inSingletonScope();
  }

  private bindBlockchainNodes() {
    this.container.bind<IBlockchainNodeLocal>(TYPES.BlockchainNodeLocalMain)
        .toDynamicValue((context: interfaces.Context) => {
          const logger = context.container.get<ILoggerAll>(TYPES.ILoggerAll);
          const mainRpcUrl = context.container.get<string>(TYPES.MainLocalNodeURI);
          const alchemyNodeLabel = context.container.get<string>(TYPES.AlchemyNodeLabel);

          return new BlockchainNodeLocal(logger, mainRpcUrl, alchemyNodeLabel);
        }).inTransientScope();

    this.container.bind<IBlockchainNodeLocal>(TYPES.BlockchainNodeLocalAlt)
        .toDynamicValue((context: interfaces.Context) => {
          const logger = context.container.get<ILoggerAll>(TYPES.ILoggerAll);
          const altRpcUrl = context.container.get<string>(TYPES.AltLocalNodeURI);
          return new BlockchainNodeLocal(logger, altRpcUrl, 'infura-node');
        }).inTransientScope();

    this.container.bind<IBlockchainReader>(TYPES.IBlockchainReader).to(BlockchainReader).inTransientScope();
  }

  private bindHealthMonitoring() {
    this.container.bind<IBlockchainNodeHealthMonitor>(TYPES.IBlockchainNodeHealthMonitor)
        .to(BlockchainNodeHealthMonitor).inTransientScope();

    this.container.bind<IHostNameProvider>(TYPES.IHostNameProvider).to(HostNameProvider).inTransientScope();

    this.container.bind<ISignalHeartbeat>(TYPES.ISignalHeartbeat).to(SignalAWSHeartbeat).inTransientScope();

    this.container.bind<ISignalCriticalFailure>(TYPES.ISignalCriticalFailure)
        .to(SignalAWSCriticalFailure).inTransientScope();

    this.container.bind<IHealthMonitor>(TYPES.IHealthMonitor).to(HealthMonitor).inTransientScope();
  }

  private bindAbiManagement() {
    this.container.bind<IAbiStorage>(TYPES.IAbiStorageDynamoDB).to(AbiStorageDynamoDB).inTransientScope();

    this.container.bind<IAbiFetcher>(TYPES.IAbiFetcherEtherScan).to(AbiFetcherEtherscan).inTransientScope();

    this.container.bind<IAbiRepo>(TYPES.IAbiRepo).to(AbiRepo).inTransientScope();
  }

  private bindRuleEngine() {
    this.container.bind<IFactoryRule>(TYPES.IFactoryRule).to(FactoryRule).inTransientScope();

    this.container.bind<IRuleEngine>(TYPES.IRuleEngine).to(RuleEngine).inTransientScope();
  }

  private bindTransactionQueue() {
    this.container.bind<ITxQueue>(TYPES.PostgreTxQueue).to(PostgreTxQueue).inSingletonScope();

    this.container.bind<ITransactionQueuer>(TYPES.ITransactionQueuer).to(TransactionQueuer).inSingletonScope();
  }

  private bindRules() {
    this.container.bind<Rule>(TypeRule.Dummy).to(RuleDummy).inTransientScope();
    this.container.bind<Rule>(TypeRule.ExpirePositions).to(RuleExpirePositions).inTransientScope();
    this.container.bind<Rule>(TypeRule.UniswapPSPRebalance).to(RuleUniswapPSPRebalance).inTransientScope();
    this.container.bind<Rule>(TypeRule.RuleBalanceCurvePoolWithVault)
        .to(RuleBalanceCurvePoolWithVault).inTransientScope();
  }

  private bindGroot() {
    this.container.bind<IGroot>(TYPES.Groot).to(Groot).inSingletonScope();
    this.container.bind<Container>(Container).toConstantValue(this.container);
  }

  public getContainer(): Container {
    return this.container;
  }
}
