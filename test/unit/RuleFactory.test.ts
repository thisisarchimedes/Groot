import {expect} from 'chai';
import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {RuleParams} from '../../src/rule_engine/rule/Rule';

describe('Rule Factory', function() {
  const logger: LoggerAdapter = new LoggerAdapter();

  it('should create Rule object from a dummy rule config', async function() {
    const ruleFactory = new FactoryRule(logger);

    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.Dummy,
      params: {
        message: 'I AM GROOT',
      },
    };

    const rule = ruleFactory.createRule(dummyRule.ruleType, dummyRule.params as RuleParams);
    expect(rule).not.to.be.undefined;
    await rule.evaluate();
    expect(logger.getLatestLogLine()).to.contain('I AM GROOT');
  });
});
