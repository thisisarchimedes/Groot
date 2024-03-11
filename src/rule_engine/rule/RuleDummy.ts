import {Rule, RuleParams} from './Rule';
import {UrgencyLevel} from '../TypesRule';
import {OutboundTransaction} from '../../blockchain/OutboundTransaction';

export interface RuleParamsDummy extends RuleParams {
  message: string;
  NumberOfDummyTxs: number;
  evalSuccess: boolean;
}

export class RuleDummy extends Rule {
  public async evaluate(): Promise<void> {
    const params = this.params as RuleParamsDummy;
    this.logger.info('RuleDummy.evaluate() called: ' + params.message);

    const blockNumber = await this.blockchainReader.getBlockNumber();

    if (params.evalSuccess === false) {
      throw new Error('RuleDummy.evaluate() failed');
    }

    const NumberOfDummyTxs = params.NumberOfDummyTxs;
    for (let i = 0; i < NumberOfDummyTxs; i++) {
      const dummyTx = this.createDummyTransaction(i, blockNumber);
      this.pushTransactionToRuleLocalQueue(dummyTx);
    }
  }

  private createDummyTransaction(txNumber: number, currentBlockNumber: number): OutboundTransaction {
    return {
      urgencyLevel: UrgencyLevel.NORMAL,
      context: `this is a dummy context - number: ${txNumber} - block: ${currentBlockNumber}`,
      hash: '',
      lowLevelUnsignedTransaction: {},
    };
  }
}
