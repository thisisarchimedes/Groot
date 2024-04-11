import {BlockchainReader} from '../blockchain/blockchain_reader/BlockchainReader';
import {ILogger} from '../service/logger/interfaces/ILogger';
import {RuleParams} from './rule/Rule';
import {AbiRepo} from './tool/abi_repository/AbiRepo';

export enum TypeRule {
    Invalid = 'invalid',
    Dummy = 'dummy',
    UniswapPSPRebalance = 'uniswapPSPRebalance',
    ExpirePositions = 'expirePosition',
    RuleBalanceCurvePoolWithVault = 'balanceCurvePoolWithVault'
}


export enum Executor {
    PSP = 'PSP',
    LEVERAGE = 'LEVERAGE'
}

export enum UrgencyLevel {
    LOW = 'LOW',
    HIGH = 'HIGH'
}

export interface RuleJSONConfigItem {
    ruleType: TypeRule;
    label: string;
    params: RuleParams;
}

export interface RuleConstractorInput {
    logger: ILogger;
    blockchainReader: BlockchainReader;
    abiRepo: AbiRepo;
    ruleLabel: string;
    params: RuleParams;
}
