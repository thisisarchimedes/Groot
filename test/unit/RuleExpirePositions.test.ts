// import 'reflect-metadata';
// import { expect } from 'chai';
// import * as dotenv from 'dotenv';
// import { FactoryRule } from '../../src/rule_engine/FactoryRule';
// import { LoggerAdapter } from './adapters/LoggerAdapter';
// import { Executor, RuleJSONConfigItem, TypeRule, UrgencyLevel } from '../../src/rule_engine/TypesRule';
// import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
// import { TYPES } from '../../src/inversify.types';
// import { Container } from 'inversify';
// import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
// import { IAbiRepo } from '../../src/rule_engine/tool/abi_repository/interfaces/IAbiRepo';
// import { createTestContainer } from './inversify.config.unit_test';
// import { FactoryRule } from '../../src/rule_engine/interfaces/FactoryRule';

// dotenv.config();

// describe('Rule Factory Testings: Expire Positions', function () {
//   let container: Container;
//   let logger: LoggerAdapter;
//   let blockchainReader: BlockchainReader;
//   let abiRepo: IAbiRepo;

//   beforeEach(async function () {
//     container = createTestContainer();
//     logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
//     blockchainReader = container.get<BlockchainReader>(TYPES.IBlockchainReader);
//     abiRepo = container.get<IAbiRepo>(TYPES.IAbiRepo);

//     const localNodeAlchemy = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain);
//     const localNodeInfura = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt);
//     await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);
//   });

//   it('should create Expire positions Rule object from a rule config', function () {
//     const ruleFactory = container.get<FactoryRule>(TYPES.FactoryRule);

//     const expirePositionRule: RuleJSONConfigItem = {
//       ruleType: TypeRule.ExpirePositions,
//       label: 'Expire positions - test',
//       params: { ttlSeconds: 300, urgencyLevel: UrgencyLevel.LOW, executor: Executor.LEVERAGE },
//     };
//     const rule = ruleFactory.createRule(expirePositionRule);
//     expect(rule).not.to.be.null;
//   });

//    it('should create expire positions rule and evaluate', function() {
//     const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);
//     const expirePositionsRule: RuleJSONConfigItem = {
//       ruleType: TypeRule.ExpirePositions,
//       label: 'Expire positions - test',
//       params: {},
//     };
//     const rule = ruleFactory.createRule(expirePositionsRule);
//     expect(rule).not.to.be.null;
//     rule?.evaluate();
//     expect(rule?.getPendingTransactionCount()).to.be.eq(0);
//   });

//   // it('should ');
// });
