import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';

import {LoggerAdapter} from '../unit/adapters/LoggerAdapter';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {HeartBeatAWS} from '../../src/service/health_monitor/HeartBeat';
import {HostNameProvider} from '../../src/service/health_monitor/HostNameProvider';

dotenv.config();
chai.use(chaiAsPromised);

const {expect} = chai;

describe('Check that we work with AWS Health Check system correctly', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let configService: ConfigServiceAWS;
  const logger: LoggerAdapter = new LoggerAdapter();
  const hostNameProvider: HostNameProvider = new HostNameProvider(logger);

  beforeEach(async function() {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    configService = new ConfigServiceAWS(environment, region);
    await configService.refreshConfig();
  });

  afterEach(async function() {
    // Clean up resources if needed
  });

  it('Should return hostname', function() {
    const hostName = hostNameProvider.getHostName();
    expect(hostName).to.be.not.empty;
  });

  it('Should be able to send health check and verify the received heartbeat', async function() {
    const heartBeat: HeartBeatAWS = new HeartBeatAWS(logger, configService, hostNameProvider);

    const res = await heartBeat.sendHeartBeat();
    expect(res).to.be.true;
  });
});
