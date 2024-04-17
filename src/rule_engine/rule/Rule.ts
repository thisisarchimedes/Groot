import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {RuleConstructorInput, RuleParams} from '../TypesRule';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../tool/abi_repository/interfaces/IAbiRepo';
import {ConfigService} from '../../service/config/ConfigService';
import LeverageDataSourceDB from '../tool/data_source/LeverageDataSourceDB';

export abstract class Rule {
  protected readonly logger: ILogger;
  protected readonly blockchainReader: IBlockchainReader;
  protected readonly abiRepo: IAbiRepo;
  protected readonly configService: ConfigService;
  protected readonly LeverageDataSourceDB: LeverageDataSourceDB;

  protected ruleLabel: string;
  protected params: RuleParams;
  protected pendingTxQueue: OutboundTransaction[] = [];

  constructor(input: RuleConstructorInput) {
    this.logger = input.logger;
    this.blockchainReader = input.blockchainReader;
    this.abiRepo = input.abiRepo;
    this.configService = input.configService;
    this.LeverageDataSourceDB = input.LeverageDataSourceDB;
    this.ruleLabel = input.ruleLabel;
    this.params = input.params;
  }

  public abstract evaluate(): Promise<void>;

  protected abstract generateUniqueKey<T extends unknown[]>(...args: T): string;

  public getRuleLabel(): string {
    return this.ruleLabel;
  }

  public getPendingTransactionCount(): number {
    return this.pendingTxQueue.length;
  }

  public popTransactionFromRuleLocalQueue(): OutboundTransaction | undefined {
    return this.pendingTxQueue.shift();
  }

  protected pushTransactionToRuleLocalQueue(transaction: OutboundTransaction): void {
    this.pendingTxQueue.push(transaction);
  }
}
