import 'reflect-metadata';

import {expect} from 'chai';
import {NewRelicInterceptor} from './interceptors/NewRelicInterceptor';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {startGroot} from '../../src/main';
import {AppConfigInterceptor} from './interceptors/AppConfigInterceptor';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {EthNodeInterceptor} from './interceptors/EthNodeInterceptor';
import {RuleParamsUniswapPSPRebalance} from '../../src/rule_engine/rule/RuleUniswapPSPRebalance';
import {Executor} from '../../src/rule_engine/TypesRule';
import {UrgencyLevel} from '../../src/rule_engine/TypesRule';
import {PostgresDBInterceptor} from './interceptors/PostgresDBInterceptor';

let timeoutId: NodeJS.Timeout | null = null;

describe('Uniswap PSP Rule Acceptance', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let newRelicInterceptor: NewRelicInterceptor;
  let appConfigInterceptor: AppConfigInterceptor | undefined;
  let ethNodeMainInterceptor: EthNodeInterceptor | undefined;
  let ethNodeAltInterceptor: EthNodeInterceptor | undefined;
  let postgresInterceptor: PostgresDBInterceptor | undefined;

  beforeEach(async function() {
    const configService = createConfigService();
    await initializeConfigService(configService);

    newRelicInterceptor = createNewRelicMock(configService);

    appConfigInterceptor = undefined;
    ethNodeMainInterceptor = undefined;
    ethNodeAltInterceptor = undefined;
  });

  afterEach(function() {
    cleanupTestDoubles();
    clearMessageProcessingTimeout();
  });

  function clearMessageProcessingTimeout(): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  it('Should handle uni psp rule', async function() {
    ethNodeMainInterceptor = new EthNodeInterceptor('http://localhost:8545');
    ethNodeMainInterceptor.interceptCalls();

    ethNodeAltInterceptor = new EthNodeInterceptor('http://localhost:18545');
    ethNodeAltInterceptor.interceptCalls();

    setInterceptVariables();

    postgresInterceptor = new PostgresDBInterceptor();
    postgresInterceptor.setQueryAlwaysSuccessOnce();

    const mockRules: RuleJSONConfigItem[] = [
      createUniswapRule(150, 50),
      // createUniswapRule(50, 125),
    ];
    appConfigInterceptor = createAppConfigInterceptor(mockRules);

    const expectedMessage = 'Rule Engine loaded 1 rules';
    newRelicInterceptor.setWaitedOnMessage(expectedMessage);

    await startGroot(false);

    await waitForMessageProcessing();

    const isMessageObserved = newRelicInterceptor.isWaitedOnMessageObserved();
    expect(isMessageObserved).to.be.true;
  });

  function createConfigService(): ConfigServiceAWS {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    return new ConfigServiceAWS(environment, region);
  }

  async function initializeConfigService(
      configService: ConfigServiceAWS,
  ): Promise<void> {
    await configService.refreshConfig();
  }

  function createNewRelicMock(
      configService: ConfigServiceAWS,
  ): NewRelicInterceptor {
    const newRelicURL = new URL(configService.getNewRelicUrl());
    return new NewRelicInterceptor(
        `${newRelicURL.protocol}//${newRelicURL.host}`,
    );
  }

  function createAppConfigInterceptor(
      mockRules: RuleJSONConfigItem[],
  ): AppConfigInterceptor {
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
  function createUniswapRule(
      upperTargetTickPercentage = 150,
      lowerTargetTickPercentage = 50,
  ): RuleJSONConfigItem {
    const params: RuleParamsUniswapPSPRebalance = {
      upperTriggerThresholdPercentage: 70,
      lowerTriggerThresholdPercentage: 130,
      upperTargetTickPercentage,
      lowerTargetTickPercentage,
      strategyAddress: '0x69209d1bF6A6612d34D03D16a332154A3131212a',
      slippagePercentage: 50,
      ttlSeconds: 300,
      executor: Executor.LEVERAGE,
      urgencyLevel: UrgencyLevel.LOW,
    };
    return {
      ruleType: TypeRule.UniswapPSPRebalance,
      label: 'Uniswap PSP rebalance - test',
      params,
    };
  }
  function waitForMessageProcessing(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }
  function setInterceptVariables(): void {
    if (
      ethNodeMainInterceptor !== undefined &&
      ethNodeAltInterceptor !== undefined
    ) {
      ethNodeMainInterceptor.setEthCallResponse(
          'currentTick',
          '0x000000000000000000000000000000000000000000000000000000000003f9c8',
      );
      ethNodeAltInterceptor.setEthCallResponse(
          'currentTick',
          '0x000000000000000000000000000000000000000000000000000000000003f9c8',
      );
      ethNodeMainInterceptor.setEthCallResponse(
          'upperTick',

          '0x0000000000000000000000000000000000000000000000000000000000042978',
      );
      ethNodeAltInterceptor.setEthCallResponse(
          'upperTick',
          '0x0000000000000000000000000000000000000000000000000000000000042978',
      );

      ethNodeMainInterceptor.setEthCallResponse(
          'lowerTick',
          '0x000000000000000000000000000000000000000000000000000000000003c3fc',
      );
      ethNodeAltInterceptor.setEthCallResponse(
          'lowerTick',
          '0x000000000000000000000000000000000000000000000000000000000003c3fc',
      );
      ethNodeMainInterceptor.setEthCallResponse(
          'pool',
          '0x000000000000000000000000cbcdf9626bc03e24f779434178a73a0b4bad62ed',
      );
      ethNodeAltInterceptor.setEthCallResponse(
          'pool',
          '0x000000000000000000000000cbcdf9626bc03e24f779434178a73a0b4bad62ed',
      );
      ethNodeAltInterceptor.setEthCallResponse(
          'tickSpacing',
          '0x000000000000000000000000000000000000000000000000000000000000003c',
      );
      ethNodeMainInterceptor.setEthCallResponse(
          'tickSpacing',
          '0x000000000000000000000000000000000000000000000000000000000000003c',
      );
      ethNodeMainInterceptor.setEthCallResponse(
          'getPosition',
          /* eslint-disable-next-line  */
        "0x00000000000000000000000000000000000000000000000000000002380db72d000000000000000000000000000000000000000000000000000000000000256b0000000000000000000000000000000000000000000000000007a8c3e17358e4"
      );
      ethNodeAltInterceptor.setEthCallResponse(
          'getPosition',
          /* eslint-disable-next-line  */
        "0x00000000000000000000000000000000000000000000000000000002380db72d000000000000000000000000000000000000000000000000000000000000256b0000000000000000000000000000000000000000000000000007a8c3e17358e4"
      );
    }
  }
});
