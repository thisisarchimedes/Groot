import * as chai from 'chai';
import * as dotenv from 'dotenv';
import 'reflect-metadata';


import {LoggerAdapter} from '../unit/adapters/LoggerAdapter';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {HostNameProvider} from '../../src/service/health_monitor/HostNameProvider';
import {SignalAWSHeartbeat} from '../../src/service/health_monitor/signal/SignalAWSHeartbeat';
import {namespace} from '../../src/constants/constants';
import {SignalAWSCriticalFailure} from '../../src/service/health_monitor/signal/SignalAWSCriticalFailure';

dotenv.config();

const {expect} = chai;

describe('Check that we work with AWS Health Check system correctly', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let configService: ConfigServiceAWS;
  const logger = new LoggerAdapter();
  let signalHeartbeat: SignalAWSHeartbeat;
  const hostNameProvider: HostNameProvider = new HostNameProvider(logger);
  let signalCriticalFailure: SignalAWSCriticalFailure;

  beforeEach(async function() {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;

    configService = new ConfigServiceAWS(environment, region);
    await configService.refreshConfig();

    signalHeartbeat = new SignalAWSHeartbeat(
        configService,
        logger,
        hostNameProvider,
        namespace,
    );

    signalCriticalFailure = new SignalAWSCriticalFailure(
        configService,
        logger,
        hostNameProvider,
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
    const res = await signalHeartbeat.sendHeartbeat();
    expect(res).to.be.true;
  });

  it('Should be able to send critical failure signal', async function() {
    const res = await signalCriticalFailure.sendCriticalFailure();
    expect(res).to.be.true;
  });
});
