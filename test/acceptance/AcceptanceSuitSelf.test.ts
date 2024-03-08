import { expect } from 'chai';
import { SpyNewRelic } from './test_doubles/SpyNewRelic';
import { ConfigServiceAWS } from '../../src/service/config/ConfigServiceAWS';
import { startGroot } from '../../src/main';
import { StubAppConfig } from './test_doubles/StubAppConfig';

describe('Check that local env is setup correctly', function () {
  let spyNewRelic: SpyNewRelic;
  let spyAppConfig: StubAppConfig;
  let configService: ConfigServiceAWS;

  before(async function () {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    configService = new ConfigServiceAWS(environment, region);
    await configService.refreshConfig();

    const newRelicURL = new URL(configService.getNewRelicUrl());
    spyNewRelic = new SpyNewRelic(`${newRelicURL.protocol}//${newRelicURL.host}`);
    //spyNewRelic.spyLogEndpoint();

    spyAppConfig = new StubAppConfig();
    spyAppConfig.setupNock();
  });

  after(function () {
    spyNewRelic.cleanup();
    spyAppConfig.cleanup();
  });

  it('should load dummy rule and emmit a log item', async function () {
    spyNewRelic.setWaitedOnMessage('Queuing transaction: this is a dummy context');

    await startGroot(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const res = await spyNewRelic.isWaitedOnMessageObserved();
    expect(res).to.be.true;
  });
});
