import {BlockchainReader} from '../blockchain/blockchain_reader/BlockchainReader';
import {Logger} from '../service/logger/Logger';
import {ConfigService} from '../service/config/ConfigService';
import LeverageDataSource from './tool/data_source/LeverageDataSource';

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
    logger: Logger;
    configService: ConfigService;
    blockchainReader: BlockchainReader;
    leverageDataSource?: LeverageDataSource;
    ruleLabel: string;
    params: RuleParams;
}
