import {expect} from 'chai';
import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {ConfigServiceAdapter} from './adapters/ConfigServiceAdapter';
import {RuleEngine} from '../../src/rule_engine/RuleEngine';

describe('Rule Engine', function() {
  const logger: LoggerAdapter = new LoggerAdapter();
  const configService: ConfigServiceAdapter = new ConfigServiceAdapter();

  beforeEach(async function() {
  });

  it('should load rules from rule JSON and iterate on them, invoke each one', async function() {
    configService.setRulesFromFile('./test/unit/data/dummy_rules.json');
    await configService.refreshConfig();

    const ruleFactory = new FactoryRule(logger);
    const ruleEngine = new RuleEngine(logger, configService, ruleFactory);

    ruleEngine.loadRules();
    const tx = await ruleEngine.evaluateRules();

    expect(tx).not.to.be.undefined;
    expect(tx.length).to.be.eq(2);
    expect(logger.getLatestLogLine()).to.contain('I AM GROOT');
  });
});
