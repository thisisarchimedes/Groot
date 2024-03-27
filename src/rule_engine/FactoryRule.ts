import 'reflect-metadata';

import { Container, inject, injectable } from 'inversify';
import { IFactoryRule } from './interfaces/IFactoryRule';
import { RuleJSONConfigItem } from './TypesRule';
import { ILogger } from '../service/logger/interfaces/ILogger';
import { Rule } from './rule/Rule';
import { InversifyConfig } from '../inversify.config';


@injectable()
export class FactoryRule implements IFactoryRule {

  constructor(
    @inject(Container) private container: Container,
    @inject('ILoggerAll') private logger: ILogger
  ) { }

  public createRule(config: RuleJSONConfigItem): Rule | null {
    try {
      const ruleInstance = this.container.get<Rule>(config.ruleType);
      ruleInstance.initialize(config.label, config.params);
      return ruleInstance;
    } catch (error) {
      this.logger.warn(`Error creating rule instance for type ${config.ruleType}: ${error}`);
      return null;
    }
  }
}
