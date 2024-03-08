import {expect} from 'chai';
import {MockNewRelic} from './mocks/MockNewRelic';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {startGroot} from '../../src/main';
import {MockAppConfig} from './mocks/MockAppConfig';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';

describe('Startup and Config', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let newRelicMock: MockNewRelic;
  let appConfigMock: MockAppConfig;
  let configService: ConfigServiceAWS;

  beforeEach(async function() {
    configService = createConfigService();
    await initializeConfigService(configService);

    newRelicMock = createNewRelicMock(configService);
  });

  afterEach(function() {
    cleanupTestDoubles(newRelicMock, appConfigMock);
  });

  it('should load dummy rule and emit a log item', async function() {
    const mockRules: RuleJSONConfigItem[] = [
      {
        ruleType: TypeRule.Dummy,
        params: {
          message: 'I AM GROOT 1',
        },
      },
      {
        ruleType: TypeRule.Dummy,
        params: {
          message: 'I AM GROOT 2',
        },
      },
    ];
    appConfigMock = createAppConfigMock(mockRules);

    const expectedMessage = 'Queuing transaction: this is a dummy context';
    newRelicMock.setWaitedOnMessage(expectedMessage);

    await startGroot(false);
    await waitForMessageProcessing();

    const isMessageObserved = newRelicMock.isWaitedOnMessageObserved();
    expect(isMessageObserved).to.be.true;
  });

  it('Should handle invalid rules gracfully', async function() {
    const mockRules: RuleJSONConfigItem[] = [
      {
        ruleType: TypeRule.Invalid,
        params: {
          message: 'I AM GROOT 1',
        },
      },
      {
        ruleType: TypeRule.Dummy,
        params: {
          message: 'I AM GROOT 2',
        },
      },
    ];
    appConfigMock = createAppConfigMock(mockRules);

    const expectedMessage = 'Rule Engine loaded 1 rules';
    newRelicMock.setWaitedOnMessage(expectedMessage);

    await startGroot(false);
    await waitForMessageProcessing();

    const isMessageObserved = newRelicMock.isWaitedOnMessageObserved();
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

function createNewRelicMock(configService: ConfigServiceAWS): MockNewRelic {
  const newRelicURL = new URL(configService.getNewRelicUrl());
  return new MockNewRelic(`${newRelicURL.protocol}//${newRelicURL.host}`);
}

function createAppConfigMock(mockRules: RuleJSONConfigItem[]): MockAppConfig {
  const appConfigMock = new MockAppConfig();
  appConfigMock.setupGrootRulesNock(mockRules);
  return appConfigMock;
}

function cleanupTestDoubles(newRelicSpy: MockNewRelic, appConfigStub: MockAppConfig): void {
  newRelicSpy.cleanup();
  appConfigStub.cleanup();
}

function waitForMessageProcessing(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
