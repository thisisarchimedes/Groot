import { RuleJSONConfigItem } from '../TypesRule';
import { Rule } from '../rule/Rule';
export interface IFactoryRule {
    createRule(config: RuleJSONConfigItem): Promise<Rule | null>;
}
