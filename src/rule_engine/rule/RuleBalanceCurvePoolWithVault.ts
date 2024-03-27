import {Rule} from './Rule';
import {inject, injectable} from 'inversify';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../tool/abi_repository/interfaces/IAbiRepo';


@injectable()
export class RuleBalanceCurvePoolWithVault extends Rule {
  public evaluate(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  protected generateUniqueKey(): string {
    throw new Error('Method not implemented.');
  }
  constructor(
        @inject('ILoggerAll') logger: ILogger,
        @inject('IBlockchainReader') blockchainReader: IBlockchainReader,
        @inject('IAbiRepo') abiRepo: IAbiRepo) {
    super(logger, blockchainReader, abiRepo);
  }
}
