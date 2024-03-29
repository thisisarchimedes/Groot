import {injectable, inject} from 'inversify';

import {IBlockchainReader} from '../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {ILogger} from '../service/logger/interfaces/ILogger';
import {Rule, RuleParams} from './rule/Rule';
import {RuleDummy} from './rule/RuleDummy';
import {RuleExpirePositions} from './rule/RuleExpirePositions';
import {RuleLiquidatePositions} from './rule/RuleLiquidatePositions';
import {RuleUniswapPSPRebalance} from './rule/RuleUniswapPSPRebalance';
import {RuleJSONConfigItem, TypeRule} from './TypesRule';
import {ILoggerAll} from '../service/logger/interfaces/ILoggerAll';
import {IFactoryRule} from './interfaces/IFactoryRule';
import {IAbiRepo} from './tool/abi_repository/interfaces/IAbiRepo';
import {IConfigServiceAWS} from '../service/config/interfaces/IConfigServiceAWS';

export class ErrorRuleFactory extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErrorRuleFactory';
  }
}

@injectable()
export class FactoryRule implements IFactoryRule {
  private readonly logger: ILogger;
  private readonly config: IConfigServiceAWS;
  private readonly blockchainReader: IBlockchainReader;
  private readonly abiRepo: IAbiRepo;

  constructor(
    @inject('ILoggerAll') _logger: ILoggerAll,
    @inject('IConfigServiceAWS') _config: IConfigServiceAWS,
    @inject('IBlockchainReader') _blockchainReader: IBlockchainReader,
    @inject('IAbiRepo') _abiRepo: IAbiRepo) {
    this.logger = _logger;
    this.config = _config;
    this.blockchainReader = _blockchainReader;
    this.abiRepo = _abiRepo;
  }

  public createRule(ruleConfig: RuleJSONConfigItem): Rule | null {
    const constructorInput = {
      logger: this.logger,
      config: this.config,
      blockchainReader: this.blockchainReader,
      abiRepo: this.abiRepo,
      ruleLabel: ruleConfig.label,
      params: ruleConfig.params as RuleParams,
    };

    switch (ruleConfig.ruleType) {
      case TypeRule.Dummy:
        return new RuleDummy(constructorInput);
      case TypeRule.UniswapPSPRebalance:
        return new RuleUniswapPSPRebalance(constructorInput);
      case TypeRule.ExpirePositions:
        return new RuleExpirePositions(constructorInput);
      case TypeRule.LiquidatePositions:
        return new RuleLiquidatePositions(constructorInput);
      default:
        this.logger.warn(`Unsupported rule type: ${ruleConfig.ruleType}`);
        return null;
    }
  }
}
