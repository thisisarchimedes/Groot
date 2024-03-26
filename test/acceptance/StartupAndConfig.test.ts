import 'reflect-metadata';


import axios from 'axios';
import { ethers } from 'ethers';
import { expect } from 'chai';
import { NewRelicInterceptor } from './interceptors/NewRelicInterceptor';
import { ConfigServiceAWS } from '../../src/service/config/ConfigServiceAWS';
import { startGroot } from '../../src/main';
import { AppConfigInterceptor } from './interceptors/AppConfigInterceptor';
import { RuleJSONConfigItem, TypeRule } from '../../src/rule_engine/TypesRule';
import { EthNodeInterceptor } from './interceptors/EthNodeInterceptor';
import { Container } from 'inversify';
import { IConfigServiceAWS } from '../../src/service/config/interfaces/IConfigServiceAWS';
import { InversifyConfig } from '../../src/inversify.config';

describe('Startup and Config', function () {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let container: Container;
  let newRelicInterceptor: NewRelicInterceptor;
  let appConfigInterceptor: AppConfigInterceptor | undefined;
  let ethNodeMainInterceptor: EthNodeInterceptor | undefined;
  let ethNodeAltInterceptor: EthNodeInterceptor | undefined;

  beforeEach(async function () {
    const configService = createConfigService();
    await initializeConfigService(configService);

    const inversifyConfig = new InversifyConfig(configService);
    container = inversifyConfig.getContainer();

    newRelicInterceptor = createNewRelicMock(configService);

    appConfigInterceptor = undefined;
    ethNodeMainInterceptor = undefined;
    ethNodeAltInterceptor = undefined;
  });

  afterEach(function () {
    cleanupTestDoubles();
  });

  it('Should return block number from mock node', async function () {
    const expectedBlockNumber = 10001;
    ethNodeMainInterceptor = new EthNodeInterceptor('http://localhost:8545');
    ethNodeMainInterceptor.setMockBlockNumber(expectedBlockNumber);
    ethNodeMainInterceptor.interceptCalls();
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const blockNumber = await provider.getBlockNumber();
    expect(blockNumber).to.be.equal(expectedBlockNumber);
  });

  it('Should fake reset', async function () {
    ethNodeMainInterceptor = new EthNodeInterceptor('http://localhost:8545');
    ethNodeMainInterceptor.interceptCalls();

    const response = await axios.post('http://localhost:8545', {
      jsonrpc: '2.0',
      method: 'hardhat_reset',
      params: [],
      id: 1,
    });

    expect(response.status).to.be.eq(200);
  });

  it('should load dummy rule and emit a log item', async function () {
    const expectedBlockNumber = 10001;

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
    appConfigInterceptor = createAppConfigInterceptor(mockRules);

    ethNodeMainInterceptor = new EthNodeInterceptor('http://localhost:8545');
    ethNodeMainInterceptor.setMockBlockNumber(expectedBlockNumber);
    ethNodeMainInterceptor.interceptCalls();

    ethNodeAltInterceptor = new EthNodeInterceptor('http://localhost:18545');
    ethNodeAltInterceptor.setMockBlockNumber(expectedBlockNumber);
    ethNodeAltInterceptor.interceptCalls();

    const expectedMessage = 'Queuing transaction: this is a dummy context';
    newRelicInterceptor.setWaitedOnMessage(expectedMessage);
    await startGroot(false);
    await waitForMessageProcessing();

    const isMessageObserved = newRelicInterceptor.isWaitedOnMessageObserved();
    expect(isMessageObserved).to.be.true;
  });

  it('Should handle invalid rules gracefully', async function () {
    ethNodeMainInterceptor = new EthNodeInterceptor('http://localhost:8545');
    ethNodeMainInterceptor.interceptCalls();

    ethNodeAltInterceptor = new EthNodeInterceptor('http://localhost:18545');
    ethNodeAltInterceptor.interceptCalls();

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
    appConfigInterceptor = createAppConfigInterceptor(mockRules);

    const expectedMessage = 'Rule Engine loaded 1 rules';
    newRelicInterceptor.setWaitedOnMessage(expectedMessage);

    await startGroot(false);
    console.log('Waiting for message: ', expectedMessage);
    await waitForMessageProcessing();

    const isMessageObserved = newRelicInterceptor.isWaitedOnMessageObserved();
    expect(isMessageObserved).to.be.true;
  });

  function createConfigService(): IConfigServiceAWS {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    return new ConfigServiceAWS(environment, region);
  }

  async function initializeConfigService(configService: IConfigServiceAWS): Promise<void> {
    await configService.refreshConfig();
  }

  function createNewRelicMock(configService: IConfigServiceAWS): NewRelicInterceptor {
    const newRelicURL = new URL(configService.getNewRelicUrl());
    return new NewRelicInterceptor(`${newRelicURL.protocol}//${newRelicURL.host}`);
  }

  function createAppConfigInterceptor(mockRules: RuleJSONConfigItem[]): AppConfigInterceptor {
    const appConfigInterceptor = new AppConfigInterceptor();
    appConfigInterceptor.setupGrootRulesNock(mockRules);
    return appConfigInterceptor;
  }

  function cleanupTestDoubles(): void {
    newRelicInterceptor.cleanup();

    if (appConfigInterceptor) {
      appConfigInterceptor.cleanup();
    }

    if (ethNodeMainInterceptor) {
      ethNodeMainInterceptor.cleanup();
    }

    if (ethNodeAltInterceptor) {
      ethNodeAltInterceptor.cleanup();
    }
  }

  function waitForMessageProcessing(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
});