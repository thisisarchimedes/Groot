import 'reflect-metadata';

import { Container, inject, injectable } from 'inversify';
import { IFactoryRule } from './interfaces/IFactoryRule';
import { RuleJSONConfigItem } from './TypesRule';
import { ILogger } from '../service/logger/interfaces/ILogger';
import { Rule } from './rule/Rule';


@injectable()
export class FactoryRule implements IFactoryRule {
  constructor(
    @inject(Container) private container: Container,
    @inject('ILoggerAll') private logger: ILogger,
  ) { }

  public async createRule(config: RuleJSONConfigItem): Promise<Rule | null> {
    try {
      const ruleInstance = this.container.get<Rule>(config.ruleType);
      await ruleInstance.initialize(config.label, config.params);
      return ruleInstance;
    } catch (error) {
      this.logger.warn(`Error creating rule instance for type ${config.ruleType}: ${error}`);
      return null;
    }
  }
}
