import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {ConfigService} from '../service/config/ConfigService';
import {Logger} from '../service/logger/Logger';
import {FactoryRule} from './FactoryRule';
import {Rule, RuleParams} from './Rule';
import {RuleJSONConfigItem} from './TypesRule';

export class RuleEngine {
  private rules: Rule[] = [];

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly ruleFactory: FactoryRule,
  ) {}

  public loadRules(): void {
    const ruleConfig: RuleJSONConfigItem[] = this.configService.getRules();
    this.rules = this.createRulesFromConfig(ruleConfig);
  }

  private createRulesFromConfig(ruleConfig: RuleJSONConfigItem[]): Rule[] {
    return ruleConfig.map((config) =>
      this.ruleFactory.createRule(config.ruleType, config.params as RuleParams),
    );
  }

  public async evaluateRules(): Promise<OutboundTransaction[]> {
    const evaluateResults = await this.evaluateRulesInParallel();
    return this.getTransactionsFromEvaluateResults(evaluateResults);
  }

  private async evaluateRulesInParallel(): Promise<{ rule: Rule; shouldExecute: boolean }[]> {
    const evaluatePromises = this.rules.map(async (rule) => ({
      rule,
      shouldExecute: await rule.evaluate(),
    }));
    return Promise.all(evaluatePromises);
  }

  private getTransactionsFromEvaluateResults(
      evaluateResults: { rule: Rule; shouldExecute: boolean }[],
  ): OutboundTransaction[] {
    return evaluateResults
        .filter(({shouldExecute}) => shouldExecute)
        .map(({rule}) => rule.getTransaction() as OutboundTransaction);
  }
}
