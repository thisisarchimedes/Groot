import { expect } from 'chai';
import * as dotenv from 'dotenv';

import { FactoryRule } from '../../src/rule_engine/FactoryRule';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { RuleJSONConfigItem, TypeRule } from '../../src/rule_engine/TypesRule';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
import { AbiRepo } from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import { AbiStorageDynamoDB } from '../../src/rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import { ConfigServiceAWS } from '../../src/service/config/ConfigServiceAWS';
import { AbiFetcherEtherscan } from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';

dotenv.config();

describe('Rule Factory Testings: Expire Positions', function () {
    const logger: LoggerAdapter = new LoggerAdapter();
    let localNodeAlchemy: BlockchainNodeAdapter;
    let localNodeInfura: BlockchainNodeAdapter;
    let blockchainReader: BlockchainReader;
    let abiRepo: AbiRepo;

    beforeEach(async function () {
        localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
        await localNodeAlchemy.startNode();

        localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
        await localNodeInfura.startNode();

        blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);

        const environment = process.env.ENVIRONMENT as string;
        const region = process.env.AWS_REGION as string;
        const configSerivce: ConfigServiceAWS = new ConfigServiceAWS(environment, region);
        const abiStorage = new AbiStorageDynamoDB(configSerivce.getDynamoDBAbiRepoTable(), configSerivce.getAWSRegion());
        const abiFetcher = new AbiFetcherEtherscan(configSerivce.getEtherscanAPIKey());
        abiRepo = new AbiRepo(blockchainReader, abiStorage, abiFetcher);
    });

    it('should create Expire positions Rule object from a rule config', function () {
        const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);

        const expirePositionRule: RuleJSONConfigItem = {
            ruleType: TypeRule.ExpirePositions,
            label: 'Expire positions - test',
            params: {},
        };

        const rule = ruleFactory.createRule(expirePositionRule);
        expect(rule).not.to.be.null;
    });

    it('should create expire positions rule and evaluate', function () {
        const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);

        const expirePositionsRule: RuleJSONConfigItem = {
            ruleType: TypeRule.ExpirePositions,
            label: 'Expire positions - test',
            params: {},
        };

        const rule = ruleFactory.createRule(expirePositionsRule);
        expect(rule).not.to.be.null;

        rule?.evaluate();
        expect(rule?.getPendingTransactionCount()).to.be.eq(0);
    });

    it('should ')
});