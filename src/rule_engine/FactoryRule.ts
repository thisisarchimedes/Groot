import 'reflect-metadata';

import {RuleConstructorInput, RuleJSONConfigItem, TypeRule} from './TypesRule';
import {Logger} from '../service/logger/Logger';
import {Rule} from './rule/Rule';
import {RuleDummy} from './rule/RuleDummy';
import {RuleUniswapPSPRebalance} from './rule/RuleUniswapPSPRebalance';
import {BlockchainReader} from '../blockchain/blockchain_reader/BlockchainReader';
import {ConfigServiceAWS} from '../service/config/ConfigServiceAWS';
import {RuleLiquidatePositions} from './rule/RuleLiquidatePositions';
import LeverageDataSourceDB from './tool/data_source/LeverageDataSourceDB';
import LeverageDataSourceNode from './tool/data_source/LeverageDataSourceNode';
import {ModulesParams} from '../types/ModulesParams';


export class FactoryRule {
  private leverageDataSourceDB: LeverageDataSourceDB;
  private leverageDataSourceNode: LeverageDataSourceNode;

  constructor(
      modulesParams: ModulesParams,
     private logger: Logger = modulesParams.logger!,
     private configService: ConfigServiceAWS = modulesParams.configService!,
     private blockchainReader: BlockchainReader = modulesParams.blockchainReader!,
  ) {
    this.leverageDataSourceDB = new LeverageDataSourceDB(modulesParams);
    this.leverageDataSourceNode = new LeverageDataSourceNode(modulesParams);
  }

  public createRule(config: RuleJSONConfigItem): Rule | null {
    const constractorInput: RuleConstructorInput = {
      logger: this.logger,
      configService: this.configService,
      blockchainReader: this.blockchainReader,
      ruleLabel: config.label,
      params: config.params,
    };

    switch (config.ruleType) {
      case TypeRule.Dummy:
        return new RuleDummy(constractorInput);
      case TypeRule.UniswapPSPRebalance:
        return new RuleUniswapPSPRebalance(constractorInput);
      case TypeRule.LiquidatePositions:
        return new RuleLiquidatePositions({
          ...constractorInput,
          leverageDataSource: this.leverageDataSourceNode,
        });
      case TypeRule.ExpirePositions:
        // return new RuleExpirePositions({
        //   ...constractorInput,
        //   leverageDataSource: this.leverageDataSourceDB,
        // });
        return null;
      default:
        this.logger.warn(`Unsupported rule type: ${config.ruleType}`);
        return null;
    }
  }
}
