import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Container } from 'inversify';
import { InversifyConfig } from './inversify.config'; // Ensure this path is correct
import { TYPES } from './inversify.types'; // Adjust the path as needed
import { ILoggerAll } from './service/logger/interfaces/ILoggerAll';
import { ConfigServiceAWS } from './service/config/ConfigServiceAWS';

dotenv.config();

class GrootBootstrapper {
  private container: Container;

  constructor() {
    this.container = new Container();
  }

  public async bootstrap(): Promise<void> {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    console.log(`${new Date().toISOString()} - Starting Groot in ${environment} environment and ${region} region`);

    // Initialize configService
    const configServiceAWS = new ConfigServiceAWS(environment, region);
    await configServiceAWS.refreshConfig();

    // Create the Inversify container with the pre-initialized ConfigServiceAWS
    const inversifyConfig = new InversifyConfig(configServiceAWS);
    this.container = inversifyConfig.getContainer();

    this.setShutdownOnSigTerm();
    const groot = this.container.get<IGroot>(TYPES.Groot);

    try {
      await groot.initalizeGroot();
      await groot.prepareForAnotherCycle();
      await groot.runOneGrootCycle();
    } catch (error) {
      this.reportCriticalError(environment, region, error);
      process.exit(1);
    }
    finally {
      await groot.shutdownGroot();
    }
  }

  private reportCriticalError(environment: string, region: string, error: unknown): void {
    const errorMessage = `Unexpected CRITICAL ERROR in ${environment} ${region} main loop: ${error}`;
    const logger = this.container.get<ILoggerAll>(TYPES.ILoggerAll);
    logger.error(errorMessage);
  }

  private setShutdownOnSigTerm(): void {
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM signal. Shutting down gracefully...');
      process.exit(0);
    });
  }
}

const app = new GrootBootstrapper();
app.bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
});


// TUDO: INTEGRATE THOSE FUNCTIONS
// function getGrootParamsFromEnv(): GrootParams {
//   const environment = process.env.ENVIRONMENT as string;
//   const region = process.env.AWS_REGION as string;
//   const mainLocalNodePort = Number(process.env.MAIN_LOCAL_NODE_PORT as string);
//   const altLocalNodePort = Number(process.env.ALT_LOCAL_NODE_PORT as string);
//   const mainLocalNodeUrl = process.env.MAIN_LOCAL_NODE_URL + ':' + mainLocalNodePort;
//   const altLocalNodeUrl = process.env.ALT_LOCAL_NODE_URL + ':' + altLocalNodePort;

//   if (!environment || !region || !mainLocalNodeUrl || !altLocalNodeUrl) {
//     reportCriticalError(environment, region, 'Cannot boot. Missing environment variables');
//   }

//   return { environment, region, mainLocalNodeUrl, altLocalNodeUrl };
// }

// function reportGrootStartup(grootParams: GrootParams): void {
//   const currentDateTime = new Date().toLocaleString();
//   console.log(`[${currentDateTime}] Starting Groot: ${JSON.stringify(grootParams)}`);
// }

// function reportCriticalError(environment: string, region: string, error: unknown): void {
//   const errorMessage = `Unexpected CRITICAL ERROR in main loop: ${error}`;
//   const configService: ConfigServiceAWS = new ConfigServiceAWS(environment, region);
//   const logger: LoggerAll = new LoggerAll(configService, 'Groot');
//   logger.error(errorMessage);
// }

// function setShutdownOnSigTerm(): void {
//   process.on('SIGTERM', () => {
//     console.log('Received SIGTERM signal. Shutting down gracefully...');
//     process.exit(0);
//   });
// }
