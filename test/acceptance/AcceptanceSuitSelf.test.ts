import {expect} from 'chai';
import {MockNewRelic} from './mocks/MockNewRelic';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {startGroot} from '../../src/main';
import {MockAppConfig} from './mocks/MockAppConfig';

describe('Local Environment Setup', function() {
  let newRelicSpy: MockNewRelic;
  let appConfigStub: MockAppConfig;
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

function createNewRelicSpy(configService: ConfigServiceAWS): MockNewRelic {
  const newRelicURL = new URL(configService.getNewRelicUrl());
  return new MockNewRelic(`${newRelicURL.protocol}//${newRelicURL.host}`);
}

function createAppConfigStub(): MockAppConfig {
  const appConfigStub = new MockAppConfig();
  appConfigStub.setupNock();
  return appConfigStub;
}

function cleanupTestDoubles(newRelicSpy: MockNewRelic, appConfigStub: MockAppConfig): void {
  newRelicSpy.cleanup();
  appConfigStub.cleanup();
}

function waitForMessageProcessing(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
