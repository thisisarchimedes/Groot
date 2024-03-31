import { OutboundTransaction } from '../../blockchain/OutboundTransaction';
import { RuleJSONConfigItem } from '../TypesRule';

export interface IRuleEngine {
    loadRulesFromJSONConfig(ruleConfig: RuleJSONConfigItem[]): Promise<void>;
    evaluateRulesAndCreateOutboundTransactions(): Promise<void>;
    getOutboundTransactions(): OutboundTransaction[];
}
