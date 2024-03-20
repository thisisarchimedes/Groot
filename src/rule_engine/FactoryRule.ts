import { BlockchainReader } from '../blockchain/blockchain_reader/BlockchainReader';
import { ILogger } from '../service/logger/ILogger';
import { Logger } from '../service/logger/Logger';
import { Rule, RuleParams } from './rule/Rule';
import { RuleDummy } from './rule/RuleDummy';
import { RuleExpirePositions } from './rule/RuleExpirePositions';
import { RuleUniswapPSPRebalance } from './rule/RuleUniswapPSPRebalance';
import { AbiRepo } from './tool/abi_repository/AbiRepo';
import { RuleJSONConfigItem, TypeRule } from './TypesRule';

export class ErrorRuleFactory extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErrorRuleFactory';
  }
}

export class FactoryRule {
  private readonly logger: ILogger;
  private readonly blockchainReader: BlockchainReader;
  private readonly abiRepo: AbiRepo;

  constructor(logger: ILogger, blockchainReader: BlockchainReader, abiRepo: AbiRepo) {
    this.logger = logger;
    this.blockchainReader = blockchainReader;
    this.abiRepo = abiRepo;
  }

  public createRule(config: RuleJSONConfigItem): Rule | null {
    const constructorInput = {
      logger: this.logger,
      blockchainReader: this.blockchainReader,
      abiRepo: this.abiRepo,
      ruleLabel: config.label,
      params: config.params as RuleParams,
    };

    switch (config.ruleType) {
      case TypeRule.Dummy:
        return new RuleDummy(constructorInput);
      case TypeRule.UniswapPSPRebalance:
        return new RuleUniswapPSPRebalance(constructorInput);
      case TypeRule.ExpirePositions:
        return new RuleExpirePositions(constructorInput);
      default:
        this.logger.warn(`Unsupported rule type: ${config.ruleType}`);
        return null;
    }
  }
}
