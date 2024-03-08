import { BlockchainReader } from '../blockchain/blockchain_reader/BlockchainReader';
import {Logger} from '../service/logger/Logger';
import {Rule, RuleParams} from './rule/Rule';
import {RuleDummy} from './rule/RuleDummy';
import {TypeRule} from './TypesRule';

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

  public createRule(type: TypeRule, params: RuleParams): Rule {
    switch (type) {
      case TypeRule.Dummy:
        return new RuleDummy(this.logger, this.blockchainReader, params);
      default:
        throw new ErrorRuleFactory(`Unsupported rule type: ${type}`);
    }
  }
}
