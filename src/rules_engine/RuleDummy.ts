import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {Rule, RuleParams} from './Rule';

export interface RuleParamsDummy extends RuleParams {
  message: string;
}

export class RuleDummy extends Rule {
  public async evaluate(): Promise<boolean> {
    const params = this.params as RuleParamsDummy;
    await this.logger.info('RuleDummy.evaluate() called: ' + params.message);
    return true;
  }

  public getTransaction(): OutboundTransaction | null {
    return null;
  }
}
