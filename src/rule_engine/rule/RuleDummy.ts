import {Rule, RuleParams} from './Rule';
import {UrgencyLevel} from '../TypesRule';

export interface RuleParamsDummy extends RuleParams {
  message: string;
}

export class RuleDummy extends Rule {
  public async evaluate(): Promise<boolean> {
    const params = this.params as RuleParamsDummy;
    await this.logger.info('RuleDummy.evaluate() called: ' + params.message);

    const blockNumber = await this.blockchainReader.getBlockNumber();

    this.pendingTx = {
      urgencyLevel: UrgencyLevel.NORMAL,
      context: `this is a dummy context - block: ${blockNumber}`,
      hash: '',
      lowLevelUnsignedTransaction: {},
    };

    return true;
  }
}
