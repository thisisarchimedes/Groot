import axios from 'axios';

import {LogLevel, Logger} from './Logger';
import {ConfigService} from '../config/ConfigService';

interface LogRecord {
  message: string;
  level: string;
  timestamp: number;
  service: string;
}

class CustomJsonFormatter {
  format(record: LogRecord): string {
    return JSON.stringify({
      ...record,
      timestamp: new Date().getTime(), // timestamp in milliseconds
    });
  }
}

export class LoggerNewRelic extends Logger {
  private readonly NewRelicEndpointUrl: string;
  private readonly maxRetries: number;
  private readonly backoffFactor: number;
  private readonly apiKey: string;
  private readonly environment: string;
  private readonly serviceName: string;
  private pendingPromises: Promise<void>[] = [];

  constructor(
      configService: ConfigService,
      serviceName: string,
      maxRetries = 3,
      backoffFactor = 2,
  ) {
    super();
    this.apiKey = configService.getNewRelicAPIKey();
    this.environment = configService.getEnvironment();
    this.NewRelicEndpointUrl = configService.getNewRelicUrl();

    this.serviceName = serviceName;
    this.maxRetries = maxRetries;
    this.backoffFactor = backoffFactor;
  }

  private log(level: string, message: string): void {
    const formatter = new CustomJsonFormatter();
    const record: LogRecord = {
      message,
      level,
      timestamp: Date.now(),
      service: this.serviceName,
    };
    const formattedRecord = formatter.format(record);
    this.emit(JSON.parse(formattedRecord));
  }

  private emit(record: LogRecord): void {
    const headers = {
      'Api-Key': this.apiKey,
      'Content-Type': 'application/json',
    };

    const payload = {
      environment: this.environment,
      ...record,
    };

    const promise = (async () => {
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          await axios.post(this.NewRelicEndpointUrl, payload, {headers});
          break; // Successful request, break the loop
        } catch (error) {
          if (attempt === this.maxRetries) {
            console.error(
                `Failed to send log to New Relic after ${this.maxRetries} retries:`,
                error,
            );
          } else {
            await new Promise((resolve) =>
              setTimeout(resolve, attempt * this.backoffFactor * 1000),
            );
          }
        }
      }
    })();

    this.pendingPromises.push(promise);
  }

  async flush(): Promise<void> {
    const promisesToFlush = [...this.pendingPromises];
    this.pendingPromises = [];
    await Promise.allSettled(promisesToFlush);
  }

  debug(message: string): void {
    if (this.currentLevel >= LogLevel.Debug) {
      this.log('DEBUG', message);
    }
  }

  info(message: string): void {
    if (this.currentLevel >= LogLevel.Info) {
      this.log('INFO', message);
    }
  }

  warn(message: string): void {
    if (this.currentLevel >= LogLevel.Warn) {
      this.log('WARNING', message);
    }
  }

  error(message: string): void {
    if (this.currentLevel >= LogLevel.Error) {
      this.log('ERROR', message);
    }
  }
}
