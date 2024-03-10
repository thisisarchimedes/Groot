import Web3 from 'web3';
import {Transaction} from 'web3-types';
import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {Logger} from '../service/logger/Logger';
import {FactoryRule} from './FactoryRule';
import {Rule, RuleParams} from './rule/Rule';
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
    this.OutboundTransactions = this.addHashToTransactions(outboundTransactions);
  }

  public getOutboundTransactions(): OutboundTransaction[] {
    return this.OutboundTransactions;
  }

  private createRulesFromConfig(ruleConfig: RuleJSONConfigItem[]): Rule[] {
    return ruleConfig
        .map((config) => this.ruleFactory.createRule(config.ruleType, config.params as RuleParams))
        .filter((rule): rule is Rule => rule !== null);
  }

  private evaluateRulesInParallel(): Promise<EvaluateResult[]> {
    const evaluatePromises = this.rules.map(async (rule) => ({
      rule,
      shouldExecute: await rule.evaluate(),
    }));
    return Promise.all(evaluatePromises);
  }

  private getTransactionsFromEvaluateResults(evaluateResults: EvaluateResult[]): OutboundTransaction[] {
    const outboundTransactions: OutboundTransaction[] = [];

    for (const {rule, shouldExecute} of evaluateResults) {
      if (shouldExecute && rule.getPendingTransactionCount() > 0) {
        let transaction = rule.popTransactionFromRuleLocalQueue();
        while (transaction) {
          outboundTransactions.push(transaction);
          transaction = rule.popTransactionFromRuleLocalQueue();
        }
      }
    }

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
  shouldExecute: boolean;
}
