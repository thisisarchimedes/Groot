import 'reflect-metadata';

import {expect} from 'chai';
import {NewRelicInterceptor} from './interceptors/NewRelicInterceptor';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {startGroot} from '../../src/main';
import {AppConfigInterceptor} from './interceptors/AppConfigInterceptor';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {EthNodeInterceptor} from './interceptors/EthNodeInterceptor';
import {RuleParamsBalancerComposablePSPAdjust} from '../../src/rule_engine/rule/RuleBalancerComposablePSPAdjust';
import {Executor} from '../../src/rule_engine/TypesRule';
import {UrgencyLevel} from '../../src/rule_engine/TypesRule';
import {PostgresDBInterceptor} from './interceptors/PostgresDBInterceptor';

let timeoutId: NodeJS.Timeout | null = null;

describe('Balancer Composable PSP Rule Acceptance', function() {
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

  it('Should handle balancer psp rule', async function() {
    ethNodeMainInterceptor = new EthNodeInterceptor('http://localhost:8545');
    ethNodeMainInterceptor.interceptCalls();

    ethNodeAltInterceptor = new EthNodeInterceptor('http://localhost:18545');
    ethNodeAltInterceptor.interceptCalls();

    setInterceptVariables(BigInt(0));

    postgresInterceptor = new PostgresDBInterceptor();
    postgresInterceptor.setQueryAlwaysSuccessOnce();

    const mockRules: RuleJSONConfigItem[] = [
      createBalancerComposablePSPRule(),

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
  function createBalancerComposablePSPRule(
      adjustInThreshold = (2),
      adjustOutThreshold = 35,
      lpSlippage = (20),
      hoursNeedsPassSinceLastAdjustOut = 24,
      hoursNeedsPassSinceLastAdjustIn = 24,
      adjustOutUnderlyingSlippage = 1,
      maximumPoolOwnershipRatio = 20,
      strategyAddress = '0x4f4c4D838c1bd66A1d19f599CA9e6C6c2F6104d2',
      adapterAddress = '0x30C2C954F734f061C0fF254E310E8c93F7497a5B',
  ): RuleJSONConfigItem {
    const params: RuleParamsBalancerComposablePSPAdjust = {
      strategyAddress,
      adapterAddress,
      adjustInThreshold,
      adjustOutThreshold,
      lpSlippage,
      hoursNeedsPassSinceLastAdjustOut,
      hoursNeedsPassSinceLastAdjustIn,
      adjustOutUnderlyingSlippage,
      maximumPoolOwnershipRatio,
      ttlSeconds: 300,
      executor: Executor.PSP,
      urgencyLevel: UrgencyLevel.LOW,
    };
    return {
      ruleType: TypeRule.PSPBalancerComposableAdjust,
      label: 'Balancer PSP rebalance - test',
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
  function setInterceptVariables(underlyingBalance:bigint): void {
    if (
      ethNodeMainInterceptor !== undefined &&
      ethNodeAltInterceptor !== undefined
    ) {
      const lastAdjust = Math.floor(Date.now() / 1000 - 172800);
      // hexify as 32 bytes
      const lastAdjustHex = BigInt(lastAdjust).toString(16).padStart(64, '0');
      const underlyingBalHex = underlyingBalance.toString(16).padStart(64, '0');
      ethNodeMainInterceptor.setEthCallResponse('lastAdjustIn', `0x${lastAdjustHex}`);
      ethNodeMainInterceptor.setEthCallResponse('lastAdjustOut', `0x${lastAdjustHex}`);
      ethNodeAltInterceptor.setEthCallResponse('lastAdjustIn', `0x${lastAdjustHex}`);
      ethNodeAltInterceptor.setEthCallResponse('lastAdjustOut', `0x${lastAdjustHex}`);
      ethNodeMainInterceptor.setEthCallResponse('underlyingBalance', `0x${underlyingBalHex}`);
      ethNodeAltInterceptor.setEthCallResponse('underlyingBalance', `0x${underlyingBalHex}`);
      ethNodeMainInterceptor.setEthCallResponse('underlyingToken', '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
      ethNodeAltInterceptor.setEthCallResponse('underlyingToken', '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
      ethNodeMainInterceptor.setEthCallResponse('poolId', '0x596192bb6e41802428ac943d2f1476c1af25cc0e000000000000000000000659');
      ethNodeAltInterceptor.setEthCallResponse('poolId', '0x596192bb6e41802428ac943d2f1476c1af25cc0e000000000000000000000659');
      ethNodeMainInterceptor.setEthCallResponse('getPoolTokens', '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000132529f0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000596192bb6e41802428ac943d2f1476c1af25cc0e000000000000000000000000bf5495efe5db9ce00f80364c8b423567e58d2110000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000080000000001581e6d07fa35604a1000000000000000000000000000000000000000000000657766155f8fb211bde00000000000000000000000000000000000000000000009ca6f1e62ac5874718');
      ethNodeAltInterceptor.setEthCallResponse('getPoolTokens', '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000132529f0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000596192bb6e41802428ac943d2f1476c1af25cc0e000000000000000000000000bf5495efe5db9ce00f80364c8b423567e58d2110000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000080000000001581e6d07fa35604a1000000000000000000000000000000000000000000000657766155f8fb211bde00000000000000000000000000000000000000000000009ca6f1e62ac5874718');
      ethNodeMainInterceptor.setEthCallResponse('pool', '0x000000000000000000000000596192bb6e41802428ac943d2f1476c1af25cc0e');
      ethNodeAltInterceptor.setEthCallResponse('pool', '0x000000000000000000000000596192bb6e41802428ac943d2f1476c1af25cc0e');
      ethNodeMainInterceptor.setEthCallResponse('decimals', '0x0000000000000000000000000000000000000000000000000000000000000012');
      ethNodeAltInterceptor.setEthCallResponse('decimals', '0x0000000000000000000000000000000000000000000000000000000000000012');
      ethNodeAltInterceptor.setEthCallResponse('balanceOf', '0x0000000000000000000000000000000000000000000000000000000000000000');
      ethNodeMainInterceptor.setEthCallResponse('balanceOf', '0x0000000000000000000000000000000000000000000000000000000000000000');
      ethNodeAltInterceptor.setEthCallResponse('minPercentage', '0x0000000000000000000000000000000000000000000000000000000000000064');
      ethNodeMainInterceptor.setEthCallResponse('minPercentage', '0x0000000000000000000000000000000000000000000000000000000000000064');
    }
  }
});
