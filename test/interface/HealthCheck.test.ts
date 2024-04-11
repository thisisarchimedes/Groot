import * as chai from 'chai';
import * as dotenv from 'dotenv';
import 'reflect-metadata';


import { LoggerAdapter } from '../unit/adapters/LoggerAdapter';
import { ConfigServiceAWS } from '../../src/service/config/ConfigServiceAWS';
import { HostNameProvider } from '../../src/service/health_monitor/HostNameProvider';
import { InversifyConfig } from '../../src/inversify.config';
import { Container } from 'inversify';
import { ISignalHeartbeat } from '../../src/service/health_monitor/signal/interfaces/ISignalHeartbeat';
import { TYPES } from '../../src/inversify.types';
import { ISignalCriticalFailure } from '../../src/service/health_monitor/signal/interfaces/ISignalCriticalFailure';
import DBService from '../../src/service/db/dbService';

dotenv.config();

const { expect } = chai;

describe('Check that we work with AWS Health Check system correctly', function () {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let configService: ConfigServiceAWS;
  const logger: LoggerAdapter = new LoggerAdapter();
  const hostNameProvider: HostNameProvider = new HostNameProvider(logger);

  let container: Container = new Container();

  beforeEach(async function () {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;

    configService = new ConfigServiceAWS(environment, region);
    await configService.refreshConfig();

    const _dbService = new DBService(configService);
    await configService.refreshConfig();

    const inversifyConfig = new InversifyConfig(configService, _dbService);
    container = inversifyConfig.getContainer();
  });

  afterEach(async function () {
    // Clean up resources if needed
  });

  it('Should return hostname', function () {
    const hostName = hostNameProvider.getHostName();
    expect(hostName).to.be.not.empty;
  });

  it('Should be able to send heart beat and verify the received heartbeat', async function () {
    const heartBeat: ISignalHeartbeat = container.get<ISignalHeartbeat>(TYPES.ISignalHeartbeat);

    const res = await heartBeat.sendHeartbeat();
    expect(res).to.be.true;
  });

  it('Should be able to send critical failure signal', async function () {
    const heartBeat: ISignalHeartbeat = container.get<ISignalHeartbeat>(TYPES.ISignalHeartbeat);

    const criticalFailureSignal: ISignalCriticalFailure = container.get<ISignalCriticalFailure>(TYPES.ISignalCriticalFailure);

    const res = await criticalFailureSignal.sendCriticalFailure();
    expect(res).to.be.true;
  });
});
