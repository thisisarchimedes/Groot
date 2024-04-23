

import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {Rule} from './rule/Rule';
import {RuleJSONConfigItem} from './TypesRule';
import {ILogger} from '../service/logger/interfaces/ILogger';
import {FactoryRule} from './FactoryRule';
import {ModulesParams} from '../types/ModulesParams';

export class RuleEngine {
  private logger: ILogger;
  private rules: Rule[] = [];
  private outboundTransactions: OutboundTransaction[] = [];

  constructor(
      modulesParams: ModulesParams,
      private readonly ruleFactory: FactoryRule,
  ) {
    this.logger = modulesParams.logger!;
    this.ruleFactory = ruleFactory;
  }

  public async loadRulesFromJSONConfig(ruleConfig: RuleJSONConfigItem[]): Promise<void> {
    this.rules = await this.createRules(ruleConfig);
    this.logRuleCount();
  }

  public async evaluateRulesAndCreateOutboundTransactions(): Promise<void> {
    const evaluateResults = await this.evaluateRules();
    this.processEvaluateResults(evaluateResults);
  }

  public getOutboundTransactions(): OutboundTransaction[] {
    return this.outboundTransactions;
  }

  private async createRules(ruleConfig: RuleJSONConfigItem[]): Promise<Rule[]> {
    const rules: Rule[] = [];

    for (const config of ruleConfig) {
      const rule = await this.ruleFactory.createRule(config);
      if (rule !== null) {
        rules.push(rule);
      }
    }
    return rules;
  }

  private logRuleCount(): void {
    this.logger.debug(`Rule Engine loaded ${this.rules.length} rules.`);
  }

  private evaluateRules(): Promise<EvaluateResult[]> {
    const evaluatePromises = this.rules.map(async (rule) => {
      try {
        await rule.evaluate();
        return {rule, success: true};
      } catch (error) {
        const errorMessage = (error as Error).message;
        this.logger.error(`Rule evaluation failed for rule: ${rule.getRuleLabel()}. Error: ${errorMessage}`);
        return {rule, success: false};
      }
    });

    return Promise.all(evaluatePromises);
  }

  private processEvaluateResults(evaluateResults: EvaluateResult[]): void {
    const {successfulRuleEval, failedRuleEval, outboundTransactions} = this.aggregateEvaluateResults(evaluateResults);
    this.logger.reportRuleEvalResults(successfulRuleEval, failedRuleEval);
    this.outboundTransactions = outboundTransactions;
  }

  private aggregateEvaluateResults(evaluateResults: EvaluateResult[]): AggregatedEvaluateResults {
    let successfulRuleEval = 0;
    let failedRuleEval = 0;
    const outboundTransactions: OutboundTransaction[] = [];

    for (const {rule, success} of evaluateResults) {
      if (success) {
        successfulRuleEval++;
        this.processSuccessfulRule(rule, outboundTransactions);
      } else {
        failedRuleEval++;
      }
    }

    return {successfulRuleEval, failedRuleEval, outboundTransactions};
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
