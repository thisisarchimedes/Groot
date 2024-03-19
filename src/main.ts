import * as dotenv from 'dotenv';

import {Groot} from './Groot';
import {LoggerAll} from './service/logger/LoggerAll';
import {ConfigServiceAWS} from './service/config/ConfigServiceAWS';

dotenv.config();

export async function grootStartHere(runInfinite: boolean = true): Promise<void> {
  const environment = process.env.ENVIRONMENT as string;
  const region = process.env.AWS_REGION as string;
  const mainLocalNodePort = Number(process.env.MAIN_LOCAL_NODE_PORT as string);
  const altLocalNodePort = Number(process.env.ALT_LOCAL_NODE_PORT as string);

  console.log(`Starting Groot in ${environment} environment and ${region} region`);

  const groot = new Groot(environment, region, mainLocalNodePort, altLocalNodePort);
  await groot.initalizeGroot();

  do {
    try {
      await groot.prepareForAnotherCycle();
      await groot.runOneGrootCycle();
      await groot.sleepBetweenCycles();
    } catch (error) {
      reportCriticalError(environment, region, error);
      process.exit(1);
    }
  } while (runInfinite);

  await groot.shutdownGroot();
}

function reportCriticalError(environment: string, region: string, error: unknown): void {
  const errorMessage = `Unexpected CRITICAL ERROR in main loop: ${error}`;
  const configService: ConfigServiceAWS = new ConfigServiceAWS(environment, region);
  const logger: LoggerAll = new LoggerAll(configService, 'Groot');
  logger.error(errorMessage);
}

grootStartHere().then((a) => {
  console.log(a);
});
