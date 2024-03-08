import {expect} from 'chai';
import {SpyNewRelic} from './test_doubles/SpyNewRelic';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {startGroot} from '../../src/main';
import {StubAppConfig} from './test_doubles/StubAppConfig';

describe('Local Environment Setup', function() {
  let newRelicSpy: SpyNewRelic;
  let appConfigStub: StubAppConfig;
  let configService: ConfigServiceAWS;

  before(async function() {
    configService = createConfigService();
    await initializeConfigService(configService);

    newRelicSpy = createNewRelicSpy(configService);
    appConfigStub = createAppConfigStub();
  });

  after(function() {
    cleanupTestDoubles(newRelicSpy, appConfigStub);
  });

  it('should load dummy rule and emit a log item', async function() {
    const expectedMessage = 'Queuing transaction: this is a dummy context';
    newRelicSpy.setWaitedOnMessage(expectedMessage);

    await startGroot(true);
    await waitForMessageProcessing();

    const isMessageObserved = newRelicSpy.isWaitedOnMessageObserved();
    expect(isMessageObserved).to.be.true;
  });
});

function createConfigService(): ConfigServiceAWS {
  const environment = process.env.ENVIRONMENT as string;
  const region = process.env.AWS_REGION as string;
  return new ConfigServiceAWS(environment, region);
}

async function initializeConfigService(configService: ConfigServiceAWS): Promise<void> {
  await configService.refreshConfig();
}

function createNewRelicSpy(configService: ConfigServiceAWS): SpyNewRelic {
  const newRelicURL = new URL(configService.getNewRelicUrl());
  return new SpyNewRelic(`${newRelicURL.protocol}//${newRelicURL.host}`);
}

function createAppConfigStub(): StubAppConfig {
  const appConfigStub = new StubAppConfig();
  appConfigStub.setupNock();
  return appConfigStub;
}

function cleanupTestDoubles(newRelicSpy: SpyNewRelic, appConfigStub: StubAppConfig): void {
  newRelicSpy.cleanup();
  appConfigStub.cleanup();
}

function waitForMessageProcessing(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
