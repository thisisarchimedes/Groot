import {TxQueueAdapter} from '../test/unit/adapters/TxQueueAdapter';
import {FactoryRule} from './rule_engine/FactoryRule';
import {RuleEngine} from './rule_engine/RuleEngine';
import {ConfigServiceAWS} from './service/config/ConfigServiceAWS';
import {LoggerAll} from './service/logger/LoggerAll';
import {TransactionQueuer} from './tx_queue/TransactionQueuer';

export async function startGroot(runOnce: boolean = false): Promise<void> {
  const environment = process.env.ENVIRONMENT as string;
  const region = process.env.AWS_REGION as string;
  const configService = new ConfigServiceAWS(environment, region);
  await configService.refreshConfig();

  const logger = new LoggerAll(configService, 'Groot');

  const ruleFactory = new FactoryRule(logger);
  const ruleEngine = new RuleEngine(logger, ruleFactory);

  const queue = new TxQueueAdapter();
  const txQueuer = new TransactionQueuer(logger, queue);

  ruleEngine.loadRulesFromJSONConfig(configService.getRules());
  const txs = await ruleEngine.evaluateRules();
  await txQueuer.queueTransactions(txs);
}
