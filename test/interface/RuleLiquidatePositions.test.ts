import {expect} from 'chai';
import {LoggerConsole} from '../../src/service/logger/LoggerConsole';
import {BlockchainNodeLocal} from '../../src/blockchain/blockchain_nodes/BlockchainNodeLocal';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {AbiFetcherEtherscan} from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {AbiStorageDynamoDB} from '../../src/rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {Executor, RuleJSONConfigItem, TypeRule, UrgencyLevel} from '../../src/rule_engine/TypesRule';
import {ModulesParams} from '../../src/types/ModulesParams';
import LeverageDataSourceNode from '../../src/rule_engine/tool/data_source/LeverageDataSourceNode';

describe('Liquidator Test', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(60000);

  const modulesParams: ModulesParams = {};
  let ruleFactory: FactoryRule;
  let dataSource: LeverageDataSourceNode;

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

    ruleFactory = new FactoryRule(modulesParams);

    dataSource = new LeverageDataSourceNode(modulesParams);
  });

  it('Check liquidator answers', async function() {
    const expirePositionRule: RuleJSONConfigItem = {
      ruleType: TypeRule.LiquidatePositions,
      label: 'Liquidate positions - test',
      params: {ttlSeconds: 300, urgencyLevel: UrgencyLevel.HIGH, executor: Executor.LEVERAGE},
    };
    const rule = ruleFactory.createRule(expirePositionRule);
    // Ensure rule is created
    expect(rule).not.to.be.null;

    // Get positions amount from the data source
    const positions = await dataSource.getLivePositions();

    // Running the liquidator rule
    await rule?.evaluate();
    expect(rule?.getPendingTransactionCount()).to.be.eq(positions.length);

    const tx = rule?.popTransactionFromRuleLocalQueue();
    if (tx) { // No Live positions on chain
      expect(tx?.urgencyLevel).to.be.eq(UrgencyLevel.HIGH);
      expect(tx?.executor).to.be.eq(Executor.LEVERAGE);
      expect(tx?.ttlSeconds).to.be.eq(300);
      expect(tx?.postEvalUniqueKey).to.be.match(/^liquidate-\d*$/);
      expect(tx?.lowLevelUnsignedTransaction.value).to.be.eq(0n);
      expect(tx?.lowLevelUnsignedTransaction.to).to.be.eq(
          modulesParams.configService?.getLeverageContractInfo().positionLiquidator,
      );
      expect(tx?.lowLevelUnsignedTransaction.data).to.be.match(/^0x/);
    }
  });
});
