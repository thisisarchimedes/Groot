import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';

import {LoggerAdapter} from '../unit/adapters/LoggerAdapter';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {HeartbeatAWS} from '../../src/service/health_monitor/Heartbeat';
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

  it('Should be able to send heart beat and verify the received heartbeat', async function() {
    const heartBeat: HeartbeatAWS = new HeartbeatAWS(logger, configService, hostNameProvider);

    const res = await heartBeat.sendHeartbeat();
    expect(res).to.be.true;
  });
});
