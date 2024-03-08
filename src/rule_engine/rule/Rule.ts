import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {BlockchainReader} from '../../blockchain/blockchain_reader/BlockchainReader';
import {Logger} from '../../service/logger/Logger';
import {UrgencyLevel} from '../TypesRule';

export interface RuleParams {
  urgencyLevel: UrgencyLevel;
}

export abstract class Rule {
  protected logger: Logger;
  protected blockchainReader: BlockchainReader;

  protected params: RuleParams;
  protected pendingTx: OutboundTransaction | null = null;

  constructor(logger: Logger, blockchainReader: BlockchainReader, params: RuleParams) {
    this.logger = logger;
    this.params = params;
    this.blockchainReader = blockchainReader;
  }

  abstract evaluate(): Promise<boolean>;

  public getTransaction(): OutboundTransaction | null {
    return this.pendingTx;
  }
}
