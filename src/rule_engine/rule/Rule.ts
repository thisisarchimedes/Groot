import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {Logger} from '../../service/logger/Logger';
import {UrgencyLevel} from '../TypesRule';

export interface RuleParams {
  urgencyLevel: UrgencyLevel;
}

export abstract class Rule {
  protected logger: Logger;
  protected params: RuleParams;
  protected pendingTx: OutboundTransaction | null = null;

  constructor(logger: Logger, params: RuleParams) {
    this.logger = logger;
    this.params = params;
  }

  abstract evaluate(): Promise<boolean>;

  public getTransaction(): OutboundTransaction | null {
    return this.pendingTx;
  }
}
