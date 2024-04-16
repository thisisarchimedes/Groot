import {IBlockchainReader} from '../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../rule_engine/tool/abi_repository/interfaces/IAbiRepo';
import {RuleParams} from '../rule_engine/TypesRule';
import {ILogger} from '../service/logger/interfaces/ILogger';

export interface RuleConstructorInput {
    logger: ILogger;
    blockchainReader: IBlockchainReader;
    abiRepo: IAbiRepo
    ruleLabel: string;
    params: RuleParams;
}
