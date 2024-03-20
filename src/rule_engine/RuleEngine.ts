import { OutboundTransaction } from '../blockchain/OutboundTransaction';
import { Logger } from '../service/logger/Logger';
import { Rule } from './rule/Rule';
import { RuleJSONConfigItem } from './TypesRule';
import { FactoryRule } from './FactoryRule';
import { ILogger } from '../service/logger/ILogger';

export class RuleEngine {
  private rules: Rule[] = [];
  private outboundTransactions: OutboundTransaction[] = [];

  constructor(
    private readonly logger: ILogger,
    private readonly ruleFactory: FactoryRule,
  ) { }

  public loadRulesFromJSONConfig(ruleConfig: RuleJSONConfigItem[]): void {
    this.rules = this.createRules(ruleConfig);
    this.logRuleCount();
  }

  public async evaluateRulesAndCreateOutboundTransactions(): Promise<void> {
    const evaluateResults = await this.evaluateRules();
    this.processEvaluateResults(evaluateResults);
  }

  public getOutboundTransactions(): OutboundTransaction[] {
    return this.outboundTransactions;
  }

  private createRules(ruleConfig: RuleJSONConfigItem[]): Rule[] {
    return ruleConfig
      .map((config) => this.ruleFactory.createRule(config))
      .filter((rule): rule is Rule => rule !== null);
  }

  private logRuleCount(): void {
    this.logger.debug(`Rule Engine loaded ${this.rules.length} rules.`);
  }

  private evaluateRules(): Promise<EvaluateResult[]> {
    const evaluatePromises = this.rules.map(async (rule) => {
      try {
        await rule.evaluate();
        return { rule, success: true };
      } catch (error) {
        const errorMessage = (error as Error).message;
        this.logger.error(`Rule evaluation failed for rule: ${rule.getRuleLabel()}. Error: ${errorMessage}`);
        return { rule, success: false };
      }
    });

    return Promise.all(evaluatePromises);
  }

  private processEvaluateResults(evaluateResults: EvaluateResult[]): void {
    const { successfulRuleEval, failedRuleEval, outboundTransactions } = this.aggregateEvaluateResults(evaluateResults);
    this.logger.reportRuleEvalResults(successfulRuleEval, failedRuleEval);
    this.outboundTransactions = outboundTransactions;
  }

  private aggregateEvaluateResults(evaluateResults: EvaluateResult[]): AggregatedEvaluateResults {
    let successfulRuleEval = 0;
    let failedRuleEval = 0;
    const outboundTransactions: OutboundTransaction[] = [];

    for (const { rule, success } of evaluateResults) {
      if (success) {
        successfulRuleEval++;
        this.processSuccessfulRule(rule, outboundTransactions);
      } else {
        failedRuleEval++;
      }
    }

    return { successfulRuleEval, failedRuleEval, outboundTransactions };
  }

  private processSuccessfulRule(rule: Rule, outboundTransactions: OutboundTransaction[]): void {
    if (rule.getPendingTransactionCount() > 0) {
      let transaction = rule.popTransactionFromRuleLocalQueue();
      while (transaction) {
        outboundTransactions.push(transaction);
        transaction = rule.popTransactionFromRuleLocalQueue();
      }
    }
  }
}

interface EvaluateResult {
  rule: Rule;
  success: boolean;
}

interface AggregatedEvaluateResults {
  successfulRuleEval: number;
  failedRuleEval: number;
  outboundTransactions: OutboundTransaction[];
}
