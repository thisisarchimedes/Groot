import 'reflect-metadata';

import {RuleConstructorInput, RuleJSONConfigItem, RuleParams, TypeRule} from './TypesRule';
import {ILogger} from '../service/logger/interfaces/ILogger';
import {Rule} from './rule/Rule';
import {RuleDummy} from './rule/RuleDummy';
import {RuleUniswapPSPRebalance} from './rule/RuleUniswapPSPRebalance';
import {BlockchainReader} from '../blockchain/blockchain_reader/BlockchainReader';
import {AbiRepo} from './tool/abi_repository/AbiRepo';
import {ConfigServiceAWS} from '../service/config/ConfigServiceAWS';


export class FactoryRule {
  constructor(
     private logger: ILogger,
     _configService: ConfigServiceAWS,
     private blockchainReader: BlockchainReader,
     private abiRepo: AbiRepo,
  ) { }

  public createRule(config: RuleJSONConfigItem): Rule | null {
    const constractorInput: RuleConstructorInput = {
      logger: this.logger,
      blockchainReader: this.blockchainReader,
      abiRepo: this.abiRepo,
      ruleLabel: config.label,
      params: config.params as RuleParams,
    };

    switch (config.ruleType) {
      case TypeRule.Dummy:
        return new RuleDummy(constractorInput);
      case TypeRule.UniswapPSPRebalance:
        return new RuleUniswapPSPRebalance(constractorInput);
      default:
        this.logger.warn(`Unsupported rule type: ${config.ruleType}`);
        return null;
    }
  }
}
