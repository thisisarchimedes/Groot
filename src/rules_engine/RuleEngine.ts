import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {ConfigService} from '../service/config/ConfigService';
import {Logger} from '../service/logger/Logger';
import {FactoryRule} from './FactoryRule';
import {Rule, RuleParams} from './Rule';
import {RuleJSONConfigItem} from './TypesRule';

export class RuleEngine {
  private logger: Logger;
  private configService: ConfigService;
  private ruleFactory: FactoryRule;

  private rules: Rule[] = [];

  constructor(logger: Logger, configService: ConfigService, ruleFactory: FactoryRule) {
    this.logger = logger;
    this.configService = configService;
    this.ruleFactory = ruleFactory;
  }

  public loadRules(): void {
    const ruleConfig: RuleJSONConfigItem[] = this.configService.getRules();
    this.rules = [];

    for (const config of ruleConfig) {
      const rule = this.ruleFactory.createRule(config.ruleType, config.params as RuleParams);
      this.rules.push(rule);
    }
  }

  public async evaluateRules(): Promise<OutboundTransaction[]> {
    const evaluatePromises = this.rules.map(async (rule) => {
      const shouldExecute = await rule.evaluate();
      return {rule, shouldExecute};
    });

    const evaluateResults = await Promise.all(evaluatePromises);

    const txs: OutboundTransaction[] = [];
    for (const {rule, shouldExecute} of evaluateResults) {
      if (shouldExecute) {
        txs.push(rule.getTransaction() as OutboundTransaction);
      }
    }

    return txs;
  }
}
