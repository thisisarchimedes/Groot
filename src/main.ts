import * as dotenv from 'dotenv';

import {Groot, GrootParams} from './Groot';
import {LoggerAll} from './service/logger/LoggerAll';
import {ConfigServiceAWS} from './service/config/ConfigServiceAWS';

dotenv.config();

export async function startGroot(runInfinite: boolean = true): Promise<void> {
  const grootParams = getGrootParamsFromEnv();
  reportGrootStartup(grootParams);
  const groot = new Groot(grootParams);

  setShutdownOnSigTerm();

  try {
    await groot.initalizeGroot();

    while (runInfinite) {
      await groot.prepareForAnotherCycle();
      await groot.runOneGrootCycle();
      await groot.sleepBetweenCycles();
    }
  } catch (error) {
    reportCriticalError(grootParams.environment, grootParams.region, error);
    process.exit(1);
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

  return {environment, region, mainLocalNodeUrl, altLocalNodeUrl};
}

function reportGrootStartup(grootParams: GrootParams): void {
  const currentDateTime = new Date().toLocaleString();
  console.log(`[${currentDateTime}] Starting Groot: ${JSON.stringify(grootParams)}`);
}

function reportCriticalError(environment: string, region: string, error: unknown): void {
  const errorMessage = `Unexpected CRITICAL ERROR in main loop: ${error}`;
  const configService: ConfigServiceAWS = new ConfigServiceAWS(environment, region);
  const logger: LoggerAll = new LoggerAll(configService, 'Groot');
  logger.error(errorMessage);
}

function setShutdownOnSigTerm(): void {
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal. Shutting down gracefully...');
    process.exit(0);
  });
}
