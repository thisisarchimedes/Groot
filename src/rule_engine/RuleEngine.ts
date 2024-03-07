import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {ConfigService} from '../service/config/ConfigService';
import {Logger} from '../service/logger/Logger';
import {FactoryRule} from './FactoryRule';
import {Rule, RuleParams} from './rule/Rule';
import {RuleJSONConfigItem} from './TypesRule';
import Web3 from 'web3';

export class RuleEngine {
  private rules: Rule[] = [];

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly ruleFactory: FactoryRule,
  ) { }

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

    let outboundTransactions = this.getTransactionsFromEvaluateResults(evaluateResults);

    // Generate the hash for each outbound transaction
    outboundTransactions = outboundTransactions.map((transaction) => {
      const lowLevelUnsignedTransactionHash = Web3.utils.sha3(JSON.stringify(transaction.lowLevelUnsignedTransaction));
      return {
        ...transaction,
        hash: lowLevelUnsignedTransactionHash,
      };
    });

    return outboundTransactions;
  }

  private evaluateRulesInParallel(): Promise<{ rule: Rule; shouldExecute: boolean }[]> {
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
