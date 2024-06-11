import {expect} from 'chai';
import {LoggerConsole} from '../../src/service/logger/LoggerConsole';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {Executor, RuleJSONConfigItem, TypeRule, UrgencyLevel} from '../../src/rule_engine/TypesRule';
import {ModulesParams} from '../../src/types/ModulesParams';
import LeverageDataSourceNode, {LedgerEntry} from '../../src/rule_engine/tool/data_source/LeverageDataSourceNode';
import {BlockchainNodeLiquidationAdapter} from './adapters/BlockchainNodeLiquidationAdapter';
import {PositionState} from '../../src/types/LeveragePosition';

describe('Liquidator Test', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(60000);

  const modulesParams: ModulesParams = {};
  let ruleFactory: FactoryRule;
  let dataSource: LeverageDataSourceNode;

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    // Setup Logger
    modulesParams.logger = new LoggerConsole();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeLiquidationAdapter(modulesParams, 'localNodeAlchemy');
    modulesParams.altNode = new BlockchainNodeLiquidationAdapter(modulesParams, 'localNodeInfura');
    await Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);

    ruleFactory = new FactoryRule(modulesParams);

    dataSource = new LeverageDataSourceNode(modulesParams);
  });

  it('Check liquidator answers', async function() {
    // Setup mocks
    (modulesParams.mainNode as BlockchainNodeLiquidationAdapter).setProxyInfoForAddressResponse(
        '0xDCb54f022D8fBeF4A686540848B75A22A35cF4Ce',
        {isProxy: true, implementationAddress: '0x2e8d2f9b031b58ff07c4b84a33eee86b978974cc'});
    (modulesParams.altNode as BlockchainNodeLiquidationAdapter).setProxyInfoForAddressResponse(
        '0xDCb54f022D8fBeF4A686540848B75A22A35cF4Ce',
        {isProxy: true, implementationAddress: '0x2e8d2f9b031b58ff07c4b84a33eee86b978974cc'});
    (modulesParams.mainNode as BlockchainNodeLiquidationAdapter).setProxyInfoForAddressResponse(
        '0x27E5dE33b607CB5A0fDe5Ea7c6aAFb5d51aC98c8',
        {isProxy: true, implementationAddress: '0x293CC459Aec506932C7bA4Ba662649158fCFAb2F'});
    (modulesParams.altNode as BlockchainNodeLiquidationAdapter).setProxyInfoForAddressResponse(
        '0x27E5dE33b607CB5A0fDe5Ea7c6aAFb5d51aC98c8',
        {isProxy: true, implementationAddress: '0x293CC459Aec506932C7bA4Ba662649158fCFAb2F'});
    (modulesParams.mainNode as BlockchainNodeLiquidationAdapter).setProxyInfoForAddressResponse(
        '0x7694Cd972Baa64018e5c6389740832e4C7f2Ce9a',
        {isProxy: true, implementationAddress: '0x3a7140A974407987dD2f76148Dd95a869B0D3bf7'});
    (modulesParams.altNode as BlockchainNodeLiquidationAdapter).setProxyInfoForAddressResponse(
        '0x7694Cd972Baa64018e5c6389740832e4C7f2Ce9a',
        {isProxy: true, implementationAddress: '0x3a7140A974407987dD2f76148Dd95a869B0D3bf7'});
    const nodeLivePositionResponse: LedgerEntry = {
      wbtcDebtAmount: 10000n,
      strategyAddress: '0x7694Cd972Baa64018e5c6389740832e4C7f2Ce9a',
      strategyShares: 20087n,
      positionOpenBlock: 19568844n,
      positionExpirationBlock: 19785444n,
      state: BigInt(PositionState.LIVE),
      liquidationBuffer: 105000000n,
      collateralAmount: 10000n,
      claimableAmount: 0n,
    };
    (modulesParams.mainNode as BlockchainNodeLiquidationAdapter).setReadResponse(nodeLivePositionResponse);
    (modulesParams.altNode as BlockchainNodeLiquidationAdapter).setReadResponse(nodeLivePositionResponse);
    (modulesParams.mainNode as BlockchainNodeLiquidationAdapter).setResponseLimit(3);
    (modulesParams.altNode as BlockchainNodeLiquidationAdapter).setResponseLimit(3);
    (modulesParams.mainNode as BlockchainNodeLiquidationAdapter).setResponseForOverlimit(
        {state: PositionState.UNINITIALIZED},
    );
    (modulesParams.altNode as BlockchainNodeLiquidationAdapter).setResponseForOverlimit(
        {state: PositionState.UNINITIALIZED},
    );

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
    (modulesParams.mainNode as BlockchainNodeLiquidationAdapter).resetResponseCount();
    (modulesParams.altNode as BlockchainNodeLiquidationAdapter).resetResponseCount();

    // Running the liquidator rule
    await rule?.evaluate();
    expect(rule?.getPendingTransactionCount()).to.be.eq(positions.length);

    const tx = rule?.popTransactionFromRuleLocalQueue();
    expect(tx?.urgencyLevel).to.be.eq(UrgencyLevel.HIGH);
    expect(tx?.executor).to.be.eq(Executor.LEVERAGE);
    expect(tx?.ttlSeconds).to.be.eq(300);
    expect(tx?.postEvalUniqueKey).to.be.match(/^liquidate-\d*$/);
    expect(tx?.lowLevelUnsignedTransaction.value).to.be.eq(0n);
    expect(tx?.lowLevelUnsignedTransaction.to).to.be.eq(
        modulesParams.configService?.getLeverageContractInfo().positionLiquidator,
    );
    expect(tx?.lowLevelUnsignedTransaction.data).to.be.match(/^0x/);
  });
});
