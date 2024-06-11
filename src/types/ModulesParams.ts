import {BlockchainNode} from '../blockchain/blockchain_nodes/BlockchainNode';
import {BlockchainReader} from '../blockchain/blockchain_reader/BlockchainReader';
import {RuleEngine} from '../rule_engine/RuleEngine';
import LeverageDataSourceDB from '../rule_engine/tool/data_source/LeverageDataSourceDB';
import LeverageDataSourceNode from '../rule_engine/tool/data_source/LeverageDataSourceNode';
import {ConfigServiceAWS} from '../service/config/ConfigServiceAWS';
import DBService from '../service/db/dbService';
import {BlockchainNodeHealthMonitor} from '../service/health_monitor/BlockchainNodeHealthMonitor';
import {HealthMonitor} from '../service/health_monitor/HealthMonitor';
import {HostNameProvider} from '../service/health_monitor/HostNameProvider';
import {ISignalCriticalFailure} from '../service/health_monitor/signal/interfaces/ISignalCriticalFailure';
import {ISignalHeartbeat} from '../service/health_monitor/signal/interfaces/ISignalHeartbeat';
import {Logger} from '../service/logger/Logger';
import {TransactionQueuer} from '../tx_queue/TransactionQueuer';

export interface ModulesParams {
  configService?: ConfigServiceAWS;
  logger?: Logger;
  dbService?: DBService;
  mainNode?: BlockchainNode;
  altNode?: BlockchainNode;
  signalHeartbeat?: ISignalHeartbeat;
  hostnameProvider?: HostNameProvider;
  signalCriticalFailure?: ISignalCriticalFailure;
  blockchainNodeHealthMonitor?: BlockchainNodeHealthMonitor;
  healthMonitor?: HealthMonitor;
  ruleEngine?: RuleEngine;
  transactionsQueuer?: TransactionQueuer;
  blockchainReader?: BlockchainReader;
  leverageDataSource?: LeverageDataSources;
}

export interface LeverageDataSources {
  leverageDataSourceDB?: LeverageDataSourceDB;
  leverageDataSourceNode?: LeverageDataSourceNode;
}
