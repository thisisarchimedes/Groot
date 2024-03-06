import {expect} from 'chai';
import dotenv from 'dotenv';

import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';

dotenv.config();

describe('Config Service Test', function() {
  let configService: ConfigServiceAWS;
  const ADDRESS_LENGTH = 42;

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

});


