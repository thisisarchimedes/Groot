import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {Logger} from '../service/logger/Logger';
import {UrgencyLevel} from './RuleTypes';

export interface RuleParams {
    urgencyLevel: UrgencyLevel;
}

export abstract class Rule {
  protected logger: Logger;
  protected params: RuleParams;

  constructor(logger: Logger, params: RuleParams) {
    this.logger = logger;
    this.params = params;
  }

  abstract evaluate(): Promise<boolean>;
  abstract getTransaction(): OutboundTransaction | null;
}
