import 'reflect-metadata';

import * as dotenv from 'dotenv';

import { GrootParams } from './GrootParams';
import { IGroot } from './interfaces/IGroot';
import { ConfigServiceAWS } from './service/config/ConfigServiceAWS';
import { InversifyConfig } from './inversify.config';
import { Container } from 'inversify';
import { TYPES } from './inversify.types';
import { ILoggerAll } from './service/logger/interfaces/ILoggerAll';

dotenv.config();

let container: Container = new Container();

export async function startGroot(runInfinite: boolean = true): Promise<void> {
  const grootParams = getGrootParamsFromEnv();
  reportGrootStartup(grootParams);

  const configServiceAWS = new ConfigServiceAWS(grootParams.environment, grootParams.region);
  await configServiceAWS.refreshConfig();

  const inversifyConfig = new InversifyConfig(configServiceAWS);
  container = inversifyConfig.getContainer();
  const groot = container.get<IGroot>(TYPES.Groot);

  setShutdownOnSigTerm();

  try {
    await groot.initalizeGroot();

    do {
      await groot.prepareForAnotherCycle();
      await groot.runOneGrootCycle();
      await groot.logger.flush();
      await groot.sleepBetweenCycles();
    } while (runInfinite);
  } catch (error) {
    reportCriticalError(grootParams.environment, grootParams.region, error);
    process.exit(1);
  } finally {
    await groot.logger.flush();
  }

  await groot.shutdownGroot();
}

function getGrootParamsFromEnv(): GrootParams {
  const environment = process.env.ENVIRONMENT as string;
  const region = process.env.AWS_REGION as string;
  const mainLocalNodePort = Number(process.env.MAIN_LOCAL_NODE_PORT as string);
  const altLocalNodePort = Number(process.env.ALT_LOCAL_NODE_PORT as string);
  const mainLocalNodeUrl = process.env.MAIN_LOCAL_NODE_URL + ':' + mainLocalNodePort;
  const altLocalNodeUrl = process.env.ALT_LOCAL_NODE_URL + ':' + altLocalNodePort;

  if (!environment || !region || !mainLocalNodeUrl || !altLocalNodeUrl) {
    reportCriticalError(environment, region, 'Cannot boot. Missing environment variables');
  }

  return { environment, region, mainLocalNodeUrl, altLocalNodeUrl };
}

function reportGrootStartup(grootParams: GrootParams): void {
  const currentDateTime = new Date().toLocaleString();
  console.log(`[${currentDateTime}] Starting Groot: ${JSON.stringify(grootParams)}`);
}

function reportCriticalError(environment: string, region: string, error: unknown): void {
  const errorMessage = `Unexpected CRITICAL ERROR in main loop: ${error}`;
  const logger = container.get<ILoggerAll>(TYPES.ILoggerAll);
  logger.error(errorMessage);
}

function setShutdownOnSigTerm(): void {
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal. Shutting down gracefully...');
    process.exit(0);
  });
}

startGroot(false).then(a => {
  console.log(a);
});