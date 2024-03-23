import { IBlockchainReader } from '../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import { RuleParams } from '../rule_engine/rule/Rule';
import { ILogger } from '../service/logger/interfaces/ILogger';

export interface RuleConstructorInput {
    logger: ILogger;
    blockchainReader: IBlockchainReader;
    abiRepo: IAbiRepo
    ruleLabel: string;
    params: RuleParams;
}
