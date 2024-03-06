import {Logger} from '../service/logger/Logger';
import {Rule, RuleParams} from './Rule';
import {RuleDummy} from './RuleDummy';
import {RuleType} from './RuleTypes';

export class ErrorRuleFactory extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErrorRuleFactory';
  }
}

export class RuleFactory {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public createRule(type: RuleType, params: RuleParams): Rule {
    switch (type) {
      case RuleType.Dummy:
        return new RuleDummy(this.logger, params);
      default:
        throw new ErrorRuleFactory(`Unsupported rule type: ${type}`);
    }
  }
}
