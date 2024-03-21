import { IBlockchainReader } from '../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import { RuleParams } from '../rule_engine/rule/Rule';
import { AbiRepo } from '../rule_engine/tool/abi_repository/AbiRepo';
import { ILogger } from '../service/logger/interfaces/ILogger';

export interface RuleConstructorInput {
    logger: ILogger;
    blockchainReader: IBlockchainReader;
    abiRepo: AbiRepo
    ruleLabel: string;
    params: RuleParams;
}
