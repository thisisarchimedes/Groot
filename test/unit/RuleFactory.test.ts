import {expect} from 'chai';
import {RuleFactory} from '../../src/rules_engine/RuleFactory';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {RuleJSONConfigItem, RuleType} from '../../src/rules_engine/RuleTypes';
import {RuleParams} from '../../src/rules_engine/Rule';

describe('Rule Factory', function() {
  const logger: LoggerAdapter = new LoggerAdapter();

  it('should create Rule object from a dummy rule config', async function() {
    const ruleFactory = new RuleFactory(logger);

    const dummyRule: RuleJSONConfigItem = {
      ruleType: RuleType.Dummy,
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
