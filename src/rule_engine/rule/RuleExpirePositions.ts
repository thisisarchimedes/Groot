import { Rule, RuleParams } from './Rule';
import { UrgencyLevel } from '../TypesRule';
import { OutboundTransaction } from '../../blockchain/OutboundTransaction';
import LeverageDataSource from '../tool/data_source/LeverageDataSource';
import { RuleConstructorInput } from '../../types/RuleConstructorInput';

export interface RuleParamsDummy extends RuleParams {
  message: string;
  NumberOfDummyTxs: number;
  evalSuccess: boolean;
}

export class RuleExpirePositions extends Rule {
  private leverageDataSource: LeverageDataSource;


  constructor(constractorInput: RuleConstructorInput) {
    super(constractorInput);
    this.leverageDataSource = new LeverageDataSource();
  }

  public async evaluate(): Promise<void> {
    const params = this.params as RuleParamsDummy;
    const blockNumber = await this.blockchainReader.getBlockNumber();
    console.log('blocknumber', blockNumber);
    const livePositions = await this.leverageDataSource.getLivePositions();
    console.log('livePositions', livePositions.length);
    this.logger.info('RuleExpirePositions.evaluate() called: ' + params.message);


    if (params.evalSuccess === false) {
      throw new Error('RuleExpirePositions.evaluate() failed');
    }

    for (let i = 0; i < params.NumberOfDummyTxs; i++) {
      const dummyTx = this.createDummyTransaction(i, blockNumber);
      this.pushTransactionToRuleLocalQueue(dummyTx);
    }
  }

  private createDummyTransaction(txNumber: number, currentBlockNumber: number): OutboundTransaction {
    return {
      urgencyLevel: UrgencyLevel.NORMAL,
      context: `this is a dummy context - number: ${txNumber} - block: ${currentBlockNumber}`,
      postEvalUniqueKey: this.generateUniqueKey(),
      lowLevelUnsignedTransaction: {},
    };
  }

  protected generateUniqueKey(): string {
    return 'dummyKey';
  }
}
