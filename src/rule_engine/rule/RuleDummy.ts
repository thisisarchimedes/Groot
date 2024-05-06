import 'reflect-metadata';

import {Rule} from './Rule';
import {OutboundTransaction, RawTransactionData} from '../../blockchain/OutboundTransaction';
import {RuleConstructorInput, RuleParams} from '../TypesRule';

export interface RuleParamsDummy extends RuleParams {
  message: string;
  NumberOfDummyTxs: number;
  evalSuccess: boolean;
}

export class RuleDummy extends Rule {
  constructor(input: RuleConstructorInput) {
    super(input);
    // this.uniswap = new Uniswap('');
  }

  public evaluate(): Promise<void> {
    const params = this.params as RuleParamsDummy;

    this.logger.info('I AM GROOT');

    this.logger.info('RuleDummy.evaluate() called: ' + params.message);

    if (params.evalSuccess === false) {
      throw new Error('RuleDummy.evaluate() failed');
    }
    for (let i = 0; i < params.NumberOfDummyTxs; i++) {
      const dummyTx = this.createDummyTransaction();
      this.pushTransactionToRuleLocalQueue(dummyTx);
    }

    return Promise.resolve();
  }

  private createDummyTransaction(): OutboundTransaction {
    return {
      urgencyLevel: this.params.urgencyLevel,
      executor: this.params.executor,
      context: `RuleDummy`,
      postEvalUniqueKey: this.generateUniqueKey(),
      lowLevelUnsignedTransaction: {} as RawTransactionData,
      ttlSeconds: this.params.ttlSeconds,
    };
  }

  protected generateUniqueKey(): string {
    return 'dummyKey';
  }
}
