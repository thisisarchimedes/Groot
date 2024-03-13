import {BlockchainReader} from '../blockchain/blockchain_reader/BlockchainReader';
import {Logger} from '../service/logger/Logger';
import {Rule, RuleParams} from './rule/Rule';
import {RuleDummy} from './rule/RuleDummy';
import {RuleUniswapPSPRebalance} from './rule/RuleUniswapPSPRebalance';
import {AbiRepo} from './tool/abi_repository/AbiRepo';
import {RuleJSONConfigItem, TypeRule} from './TypesRule';

export class ErrorRuleFactory extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErrorRuleFactory';
  }
}

export class FactoryRule {
  private readonly logger: Logger;
  private readonly blockchainReader: BlockchainReader;
  private readonly abiRepo: AbiRepo;

  constructor(logger: Logger, blockchainReader: BlockchainReader, abiRepo: AbiRepo) {
    this.logger = logger;
    this.blockchainReader = blockchainReader;
    this.abiRepo = abiRepo;
  }

  public createRule(config: RuleJSONConfigItem): Rule | null {
    const constractorInput = {
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
