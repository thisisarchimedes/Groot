import {assert, expect} from 'chai';
import {LoggerConsole} from '../../src/service/logger/LoggerConsole';
import {BlockchainNodeLocal} from '../../src/blockchain/blockchain_nodes/BlockchainNodeLocal';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {AbiFetcherEtherscan} from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {AbiStorageDynamoDB} from '../../src/rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import DBService from '../../src/service/db/dbService';
import {Executor, RuleJSONConfigItem, TypeRule, UrgencyLevel} from '../../src/rule_engine/TypesRule';
import {ModulesParams} from '../../src/types/ModulesParams';

describe('Liquidator Test', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(60000);

  const modulesParams: ModulesParams = {};
  let ruleFactory: FactoryRule;

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('StableApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    // Setup Logger
    modulesParams.logger = new LoggerConsole();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeLocal(
        modulesParams,
        `http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`,
        'localNodeAlchemy',
    );
    modulesParams.altNode = new BlockchainNodeLocal(
        modulesParams,
        `http://localhost:${process.env.ALT_LOCAL_NODE_PORT || 18545}`,
        'localNodeInfura',
    );
    await Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);
    const abiStorage = new AbiStorageDynamoDB(modulesParams);
    const abiFetcher = new AbiFetcherEtherscan(modulesParams);
    modulesParams.abiRepo = new AbiRepo(modulesParams, abiStorage, abiFetcher);

    modulesParams.dbService = new DBService(modulesParams);

    ruleFactory = new FactoryRule(modulesParams);
  });

  it('Check liquidator answers', async function() {
    const latestBlock = await modulesParams.blockchainReader!.getBlockNumber();

    const expirePositionRule: RuleJSONConfigItem = {
      ruleType: TypeRule.LiquidatePositions,
      label: 'Liquidate positions - test',
      params: {ttlSeconds: 300, urgencyLevel: UrgencyLevel.HIGH, executor: Executor.LEVERAGE},
    };
    const rule = ruleFactory.createRule(expirePositionRule);
    expect(rule).not.to.be.null;

    await rule?.evaluate();
    console.log(rule?.popTransactionFromRuleLocalQueue()); // Debug
    expect(rule?.getPendingTransactionCount()).to.be.eq(0);
    return;
  });
});
