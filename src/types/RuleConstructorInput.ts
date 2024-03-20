import { BlockchainReader } from '../blockchain/blockchain_reader/BlockchainReader';
import { RuleParams } from '../rule_engine/rule/Rule';
import { AbiRepo } from '../rule_engine/tool/abi_repository/AbiRepo';
import { ILogger } from '../service/logger/interfaces/ILogger';
import { Logger } from '../service/logger/Logger';

export interface RuleConstructorInput {
    logger: ILogger;
    blockchainReader: BlockchainReader;
    abiRepo: AbiRepo
    ruleLabel: string;
    params: RuleParams;
}
