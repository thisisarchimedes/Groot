import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {RuleJSONConfigItem} from '../TypesRule';

export interface IRuleEngine {
    loadRulesFromJSONConfig(ruleConfig: RuleJSONConfigItem[]): void;
    evaluateRulesAndCreateOutboundTransactions(): Promise<void>;
    getOutboundTransactions(): OutboundTransaction[];
}
