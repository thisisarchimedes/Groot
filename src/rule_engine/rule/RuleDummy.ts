import {Rule, RuleParams} from './Rule';
import {UrgencyLevel} from '../TypesRule';
import {OutboundTransaction} from '../../blockchain/OutboundTransaction';

export interface RuleParamsDummy extends RuleParams {
  message: string;
  NumberOfDummyTxs: number;
}

export class RuleDummy extends Rule {
  public async evaluate(): Promise<boolean> {
    const params = this.params as RuleParamsDummy;
    this.logger.info('RuleDummy.evaluate() called: ' + params.message);

    const blockNumber = await this.blockchainReader.getBlockNumber();

    const NumberOfDummyTxs = params.NumberOfDummyTxs;
    for (let i = 0; i < NumberOfDummyTxs; i++) {
      const dummyTx = this.createDummyTransaction(i, blockNumber);
      this.pushTransactionToRuleLocalQueue(dummyTx);
    }

    return true;
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
