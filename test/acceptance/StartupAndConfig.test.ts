import axios from 'axios';
import {ethers} from 'ethers';
import {expect} from 'chai';
import {MockNewRelic} from './mocks/MockNewRelic';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {grootStartHere} from '../../src/main';
import {MockAppConfig} from './mocks/MockAppConfig';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {MockEthNode} from './mocks/MockEthNode';


describe('Startup and Config', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let newRelicMock: MockNewRelic;
  let appConfigMock: MockAppConfig | undefined;
  let ethNodeMainMock: MockEthNode | undefined;
  let ethNodeAltMock: MockEthNode | undefined;

  let configService: ConfigServiceAWS;

  beforeEach(async function() {
    configService = createConfigService();
    await initializeConfigService();

    newRelicMock = createNewRelicMock();

    appConfigMock = undefined;
    ethNodeMainMock = undefined;
    ethNodeAltMock = undefined;
  });

  afterEach(function() {
    cleanupTestDoubles();
  });

  it('Should return block number from mock node', async function() {
    const expectedBlockNumber = 10001;
    ethNodeMainMock = new MockEthNode('http://localhost:8545');
    ethNodeMainMock.setMockBlockNumber(expectedBlockNumber);
    ethNodeMainMock.interceptCalls();
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const blockNumber = await provider.getBlockNumber();
    expect(blockNumber).to.be.equal(expectedBlockNumber);
  });

  it('Should fake reset', async function() {
    ethNodeMainMock = new MockEthNode('http://localhost:8545');
    ethNodeMainMock.interceptCalls();

    const response = await axios.post('http://localhost:8545', {
      jsonrpc: '2.0',
      method: 'hardhat_reset',
      params: [],
      id: 1,
    });

    expect(response.status).to.be.eq(200);
  });

  it('should load dummy rule and emit a log item', async function() {
    const expectedBlockNumber = 10001;


    ethNodeMainMock = new MockEthNode('http://localhost:8545');
    ethNodeMainMock.interceptCalls();

    ethNodeAltMock = new MockEthNode('http://localhost:18545');
    ethNodeAltMock.interceptCalls();

    const mockRules: RuleJSONConfigItem[] = [
      {
        ruleType: TypeRule.Dummy,
        label: 'dummyRule',
        params: {
          message: 'I AM GROOT 1',
          NumberOfDummyTxs: 1,
        },
      },
      {
        ruleType: TypeRule.Dummy,
        label: 'dummyRule',
        params: {
          message: 'I AM GROOT 2',
          NumberOfDummyTxs: 2,
          evalSuccess: true,
        },
      },
    ];
    appConfigMock = createAppConfigMock(mockRules);

    ethNodeMainMock = new MockEthNode('http://localhost:8545');
    ethNodeMainMock.setMockBlockNumber(expectedBlockNumber);
    ethNodeMainMock.interceptCalls();

    ethNodeAltMock = new MockEthNode('http://localhost:18545');
    ethNodeAltMock.setMockBlockNumber(expectedBlockNumber);
    ethNodeAltMock.interceptCalls();

    const expectedMessage = 'Queuing transaction: this is a dummy context';
    newRelicMock.setWaitedOnMessage(expectedMessage);
    await grootStartHere(false);
    await waitForMessageProcessing();

    const isMessageObserved = newRelicMock.isWaitedOnMessageObserved();
    expect(isMessageObserved).to.be.true;
  });

  it('Should handle invalid rules gracfully', async function() {
    ethNodeMainMock = new MockEthNode('http://localhost:8545');
    ethNodeMainMock.interceptCalls();
    ethNodeAltMock = new MockEthNode('http://localhost:18545');
    ethNodeAltMock.interceptCalls();

    const mockRules: RuleJSONConfigItem[] = [
      {
        ruleType: TypeRule.Invalid,
        label: 'invalidRule',
        params: {
          message: 'I AM GROOT 1',
        },
      },
      {
        ruleType: TypeRule.Dummy,
        label: 'dummyRule',
        params: {
          message: 'I AM GROOT 2',
          NumberOfDummyTxs: 1,
          evalSuccess: true,
        },
      },
    ];
    appConfigMock = createAppConfigMock(mockRules);

    const expectedMessage = 'Rule Engine loaded 1 rules';
    newRelicMock.setWaitedOnMessage(expectedMessage);

    await grootStartHere(false);
    console.log('Waiting for message: ', expectedMessage);
    await waitForMessageProcessing();

    const isMessageObserved = newRelicMock.isWaitedOnMessageObserved();
    expect(isMessageObserved).to.be.true;
  });

  function createConfigService(): ConfigServiceAWS {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    return new ConfigServiceAWS(environment, region);
  }

  async function initializeConfigService(): Promise<void> {
    await configService.refreshConfig();
  }

  function createNewRelicMock(): MockNewRelic {
    const newRelicURL = new URL(configService.getNewRelicUrl());
    return new MockNewRelic(`${newRelicURL.protocol}//${newRelicURL.host}`);
  }

  function createAppConfigMock(mockRules: RuleJSONConfigItem[]): MockAppConfig {
    const appConfigMock = new MockAppConfig();
    appConfigMock.setupGrootRulesNock(mockRules);
    return appConfigMock;
  }

  function cleanupTestDoubles(): void {
    newRelicMock.cleanup();

    if (appConfigMock) {
      appConfigMock.cleanup();
    }

    if (ethNodeMainMock) {
      ethNodeMainMock.cleanup();
    }

    if (ethNodeAltMock) {
      ethNodeAltMock.cleanup();
    }
  }

  function waitForMessageProcessing(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
});
