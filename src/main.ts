import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { container } from './inversify.config'; // Ensure this path is correct
import { TYPES } from './inversify.config'; // Adjust the path as needed
import { Groot } from './Groot';
import { ILoggerAll } from './service/logger/interfaces/ILoggerAll';

dotenv.config();

export async function grootStartHere(): Promise<void> {
  const environment = process.env.ENVIRONMENT as string;
  const region = process.env.AWS_REGION as string;
  console.log(`${new Date().toISOString()} - Starting Groot in ${environment} environment and ${region} region`);

  // Resolve Groot from the container instead of directly instantiating it
  const groot = container.get<Groot>(TYPES.Groot);

  setShutdownOnSigTerm();

  try {
    await groot.initalizeGroot();
    await groot.prepareForAnotherCycle();
    await groot.runOneGrootCycle();
  } catch (error) {
    reportCriticalError(environment, region, error);
    process.exit(1);
  }

  await groot.shutdownGroot();
}

function reportCriticalError(environment: string, region: string, error: unknown): void {
  const errorMessage = `Unexpected CRITICAL ERROR in main loop: ${error}`;
  // Use the container to resolve ILoggerAll for logging errors
  const logger = container.get<ILoggerAll>(TYPES.ILoggerAll);
  logger.error(errorMessage);
}

function setShutdownOnSigTerm(): void {
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal. Shutting down gracefully...');
    process.exit(0);
  });
}

grootStartHere();
