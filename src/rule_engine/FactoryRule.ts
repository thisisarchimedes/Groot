import {BlockchainReader} from '../blockchain/blockchain_reader/BlockchainReader';
import {Logger} from '../service/logger/Logger';
import {Rule, RuleParams} from './rule/Rule';
import {RuleDummy} from './rule/RuleDummy';
import {RuleUniswapPSPRebalance} from './rule/RuleUniswapPSPRebalance';
import {RuleJSONConfigItem, TypeRule} from './TypesRule';

export class ErrorRuleFactory extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErrorRuleFactory';
  }
}

export class FactoryRule {
  private readonly logger: Logger;
  private readonly blockchainReader: BlockchainReader;

  constructor(logger: Logger, blockchainReader: BlockchainReader) {
    this.logger = logger;
    this.blockchainReader = blockchainReader;
  }

  public createRule(config: RuleJSONConfigItem): Rule | null {
    switch (config.ruleType) {
      case TypeRule.Dummy:
        return new RuleDummy(this.logger, this.blockchainReader, config.label, config.params as RuleParams);
      case TypeRule.UniswapPSPRebalance:
        return new RuleUniswapPSPRebalance(this.logger, this.blockchainReader,
            config.label, config.params as RuleParams);
      default:
        this.logger.warn(`Unsupported rule type: ${config.ruleType}`);
        return null;
    }
  }
}
