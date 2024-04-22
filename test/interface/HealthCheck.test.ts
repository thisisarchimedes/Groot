import * as chai from 'chai';
import * as dotenv from 'dotenv';
import 'reflect-metadata';


import {LoggerAdapter} from '../unit/adapters/LoggerAdapter';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {HostNameProvider} from '../../src/service/health_monitor/HostNameProvider';
import {SignalAWSHeartbeat} from '../../src/service/health_monitor/signal/SignalAWSHeartbeat';
import {namespace} from '../../src/constants/constants';
import {SignalAWSCriticalFailure} from '../../src/service/health_monitor/signal/SignalAWSCriticalFailure';
import {ModulesParams} from '../../src/types/ModulesParams';

dotenv.config();

const {expect} = chai;

describe('Check that we work with AWS Health Check system correctly', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  const modulesParams: ModulesParams = {};
  const hostNameProvider: HostNameProvider = new HostNameProvider(modulesParams);

  beforeEach(async function() {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;

    modulesParams.configService = new ConfigServiceAWS(environment, region);
    await modulesParams.configService.refreshConfig();

    modulesParams.logger = new LoggerAdapter();

    modulesParams.signalHeartbeat = new SignalAWSHeartbeat(
        modulesParams,
        namespace,
    );

    modulesParams.signalCriticalFailure = new SignalAWSCriticalFailure(
        modulesParams,
        namespace,
    );
  });

  afterEach(async function() {
    // Clean up resources if needed
  });

  it('Should return hostname', function() {
    const hostName = hostNameProvider.getHostName();
    expect(hostName).to.be.not.empty;
  });

  it('Should be able to send heart beat and verify the received heartbeat', async function() {
    const res = await modulesParams.signalHeartbeat!.sendHeartbeat();
    expect(res).to.be.true;
  });

  it('Should be able to send critical failure signal', async function() {
    const res = await modulesParams.signalCriticalFailure!.sendCriticalFailure();
    expect(res).to.be.true;
  });
});
