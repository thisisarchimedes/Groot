import {BlockchainReader} from '../blockchain/blockchain_reader/BlockchainReader';
import {ILogger} from '../service/logger/interfaces/ILogger';
import {AbiRepo} from './tool/abi_repository/AbiRepo';
import {ConfigService} from '../service/config/ConfigService';
import LeverageDataSourceDB from './tool/data_source/LeverageDataSourceDB';

export enum TypeRule {
    Invalid = 'invalid',
    Dummy = 'dummy',
    UniswapPSPRebalance = 'uniswapPSPRebalance',
    ExpirePositions = 'expirePosition',
    LiquidatePositions = 'liquidatePosition',
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

export interface RuleParams {
    urgencyLevel: UrgencyLevel;
    ttlSeconds: number;
    executor: Executor;
}

export interface RuleJSONConfigItem {
    ruleType: TypeRule;
    label: string;
    params: RuleParams;
}

export interface RuleConstructorInput {
    logger: ILogger;
    configService: ConfigService;
    blockchainReader: BlockchainReader;
    abiRepo: AbiRepo;
    LeverageDataSourceDB: LeverageDataSourceDB;
    ruleLabel: string;
    params: RuleParams;
}
