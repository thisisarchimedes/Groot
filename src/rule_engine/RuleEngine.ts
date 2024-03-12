import Web3 from 'web3';
import {Transaction} from 'web3-types';
import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {Logger} from '../service/logger/Logger';
import {FactoryRule} from './FactoryRule';
import {Rule} from './rule/Rule';
import {RuleJSONConfigItem} from './TypesRule';


export class RuleEngine {
  private rules: Rule[] = [];
  private OutboundTransactions: OutboundTransaction[] = [];

  constructor(
    private readonly logger: Logger,
    private readonly ruleFactory: FactoryRule,
  ) { }

  public loadRulesFromJSONConfig(ruleConfig: RuleJSONConfigItem[]): void {
    this.rules = this.createRulesFromConfig(ruleConfig);
    this.logger.debug(`Rule Engine loaded ${this.rules.length} rules.`);
  }

  public async evaluateRulesAndCreateOutboundTransactions(): Promise<void> {
    const evaluateResults = await this.evaluateRulesInParallel();
    const outboundTransactions = this.getTransactionsFromEvaluateResults(evaluateResults);
    // TODO: Do we really need this hash?
    this.OutboundTransactions = this.addHashToTransactions(outboundTransactions);
  }

  public getOutboundTransactions(): OutboundTransaction[] {
    return this.OutboundTransactions;
  }

  private createRulesFromConfig(ruleConfig: RuleJSONConfigItem[]): Rule[] {
    return ruleConfig
        .map((config) => this.ruleFactory.createRule(config))
        .filter((rule): rule is Rule => rule !== null);
  }

  private async evaluateRulesInParallel(): Promise<EvaluateResult[]> {
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

    const evaluateResults = await Promise.all(evaluatePromises);
    return evaluateResults;
  }

  private getTransactionsFromEvaluateResults(evaluateResults: EvaluateResult[]): OutboundTransaction[] {
    const outboundTransactions: OutboundTransaction[] = [];
    let successfulRuleEval = 0;
    let failedRuleEval = 0;

    for (const {rule, success} of evaluateResults) {
      if (success) {
        successfulRuleEval++;
      } else {
        failedRuleEval++;
      }

      if (success && rule.getPendingTransactionCount() > 0) {
        let transaction = rule.popTransactionFromRuleLocalQueue();
        while (transaction) {
          outboundTransactions.push(transaction);
          transaction = rule.popTransactionFromRuleLocalQueue();
        }
      }
    }

    this.logger.reportRuleEvalResults(successfulRuleEval, failedRuleEval);

    return outboundTransactions;
  }

  private addHashToTransactions(transactions: OutboundTransaction[]): OutboundTransaction[] {
    return transactions.map((transaction) => ({
      ...transaction,
      hash: this.generateTransactionHash(transaction.lowLevelUnsignedTransaction),
    }));
  }

  private generateTransactionHash(transaction: Transaction): string {
    const hash = Web3.utils.sha3(JSON.stringify(transaction));
    if (hash === undefined) {
      this.logger.error(`Failed to generate hash for transaction: ${transaction}`);
      return '';
    }

    return hash;
  }
}

interface EvaluateResult {
  rule: Rule;
  success: boolean;
}
