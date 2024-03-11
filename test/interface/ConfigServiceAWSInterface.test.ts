import {expect} from 'chai';
import dotenv from 'dotenv';

import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {RuleJSONConfigItem} from '../../src/rule_engine/TypesRule';

dotenv.config();

describe('Config Service Test', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let configService: ConfigServiceAWS;

  beforeEach(async function() {
    await initalizeObjectUnderTest();
  });

  async function initalizeObjectUnderTest(): Promise<void> {
    configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await configService.refreshConfig();
  }

  it('should get main and alt RPC URL from AWS', function() {
    const mainRpcURL: string = configService.getMainRPCURL();
    expect(mainRpcURL.startsWith('http')).to.be.true;

    const altRpcURL: string = configService.getAlternativeRPCURL();
    expect(altRpcURL.startsWith('http')).to.be.true;
  });

  it('should get GrootRules JSON from AWS', function() {
    const rules: RuleJSONConfigItem[] = configService.getRules();
    expect(rules).to.not.be.undefined;
    expect(rules.length).to.be.greaterThan(0);
  });

  it('should get Groot Sleep time from AWS', function() {
    const sleepTime: number = configService.getSleepMillisecondsBetweenCycles();
    expect(sleepTime).to.not.be.undefined;
    expect(sleepTime).to.be.greaterThan(0);
  });
});


