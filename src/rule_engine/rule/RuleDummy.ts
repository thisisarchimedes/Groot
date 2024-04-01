import 'reflect-metadata';

import {Rule, RuleParams} from './Rule';
import {UrgencyLevel} from '../TypesRule';
import {OutboundTransaction, RawTransactionData} from '../../blockchain/OutboundTransaction';
import {inject, injectable} from 'inversify';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {IAbiRepo} from '../tool/abi_repository/interfaces/IAbiRepo';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';

export interface RuleParamsDummy extends RuleParams {
  message: string;
  NumberOfDummyTxs: number;
  evalSuccess: boolean;
}

@injectable()
export class RuleDummy extends Rule {
  constructor(
    @inject('ILoggerAll') logger: ILogger,
    @inject('IBlockchainReader') blockchainReader: IBlockchainReader,
    @inject('IAbiRepo') abiRepo: IAbiRepo) {
    super(logger, blockchainReader, abiRepo);
    // this.uniswap = new Uniswap('');
  }

  public async evaluate(): Promise<void> {
    const params = this.params as RuleParamsDummy;
    const blockNumber = await this.blockchainReader.getBlockNumber();

    this.logger.info('RuleDummy.evaluate() called: ' + params.message);

    if (params.evalSuccess === false) {
      throw new Error('RuleDummy.evaluate() failed');
    }

    for (let i = 0; i < params.NumberOfDummyTxs; i++) {
      const dummyTx = this.createDummyTransaction(i, blockNumber);
      this.pushTransactionToRuleLocalQueue(dummyTx);
    }
  }

  private createDummyTransaction(txNumber: number, currentBlockNumber: number): OutboundTransaction {
    return {
      urgencyLevel: UrgencyLevel.LOW,
      context: `this is a dummy context - number: ${txNumber} - block: ${currentBlockNumber}`,
      postEvalUniqueKey: this.generateUniqueKey(),
      lowLevelUnsignedTransaction: {} as RawTransactionData,
    };
  }

  protected generateUniqueKey(): string {
    return 'dummyKey';
  }
}
