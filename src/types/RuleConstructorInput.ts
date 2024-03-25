import { IBlockchainReader } from '../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import { RuleParams } from '../rule_engine/rule/Rule';
import { IAbiRepo } from '../rule_engine/tool/abi_repository/interfaces/IAbiRepo';
import { ILogger } from '../service/logger/interfaces/ILogger';

export interface RuleConstructorInput {
    logger: ILogger;
    blockchainReader: IBlockchainReader;
    abiRepo: IAbiRepo
    ruleLabel: string;
    params: RuleParams;
}
