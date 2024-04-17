import 'reflect-metadata';

import {RuleConstructorInput, RuleJSONConfigItem, TypeRule} from './TypesRule';
import {ILogger} from '../service/logger/interfaces/ILogger';
import {Rule} from './rule/Rule';
import {RuleDummy} from './rule/RuleDummy';
import {RuleUniswapPSPRebalance} from './rule/RuleUniswapPSPRebalance';
import {BlockchainReader} from '../blockchain/blockchain_reader/BlockchainReader';
import {AbiRepo} from './tool/abi_repository/AbiRepo';
import {ConfigServiceAWS} from '../service/config/ConfigServiceAWS';
import {RuleLiquidatePositions} from './rule/RuleLiquidatePositions';
import LeverageDataSourceDB from './tool/data_source/LeverageDataSourceDB';


export class FactoryRule {
  constructor(
     private logger: ILogger,
     private configService: ConfigServiceAWS,
     private blockchainReader: BlockchainReader,
     private abiRepo: AbiRepo,
     private LeverageDataSourceDB: LeverageDataSourceDB,
  ) { }

  public createRule(config: RuleJSONConfigItem): Rule | null {
    const constractorInput: RuleConstructorInput = {
      logger: this.logger,
      configService: this.configService,
      blockchainReader: this.blockchainReader,
      abiRepo: this.abiRepo,
      LeverageDataSourceDB: this.LeverageDataSourceDB,
      ruleLabel: config.label,
      params: config.params,
    };

    switch (config.ruleType) {
      case TypeRule.Dummy:
        return new RuleDummy(constractorInput);
      case TypeRule.UniswapPSPRebalance:
        return new RuleUniswapPSPRebalance(constractorInput);
      case TypeRule.LiquidatePositions:
        return new RuleLiquidatePositions(constractorInput);
      default:
        this.logger.warn(`Unsupported rule type: ${config.ruleType}`);
        return null;
    }
  }
}
