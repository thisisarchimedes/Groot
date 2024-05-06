import axios from 'axios';
import {Logger} from './Logger';
import {LogLevel} from './LogLevel';
import {ConfigServiceAWS} from '../config/ConfigServiceAWS';


interface LogRecord {
  message: string;
  level: string;
  timestamp: number;
  service: string;
  callerInfo: string;
}

interface LogFormatter {
  format(record: LogRecord): string;
}

class CustomJsonFormatter implements LogFormatter {
  format(record: LogRecord): string {
    return JSON.stringify({
      ...record,
      timestamp: new Date().getTime(),
    });
  }
}

interface NewRelicConfig {
  apiKey: string;
  environment: string;
  endpointUrl: string;
  serviceName: string;
  maxRetries: number;
  backoffFactor: number;
}


export class LoggerNewRelic extends Logger {
  private readonly config: NewRelicConfig;
  private readonly formatter: LogFormatter;
  private pendingPromises: Promise<void>[] = [];

  constructor(
      configService: ConfigServiceAWS,
      serviceName: string,
      formatter: LogFormatter = new CustomJsonFormatter(),
      maxRetries = 3,
      backoffFactor = 2,
  ) {
    super();
    this.config = {
      apiKey: configService.getNewRelicAPIKey(),
      environment: configService.getEnvironment(),
      endpointUrl: configService.getNewRelicUrl(),
      serviceName,
      maxRetries,
      backoffFactor,
    };
    this.formatter = formatter;
  }

  public async flush(): Promise<void> {
    const promisesToFlush = [...this.pendingPromises];
    this.pendingPromises = [];
    await Promise.allSettled(promisesToFlush);
  }

  public debug(message: string): void {
    this.log(LogLevel.Debug, message);
  }

  public info(message: string): void {
    this.log(LogLevel.Info, message);
  }

  public warn(message: string): void {
    this.log(LogLevel.Warn, message);
  }

  public error(message: string): void {
    this.log(LogLevel.Error, message);
  }

  private log(level: LogLevel, message: string): void {
    const callerInfo = this.getCallerInfo();

    const record: LogRecord = {
      message,
      level: LogLevel[level],
      timestamp: Date.now(),
      service: this.config.serviceName,
      callerInfo: callerInfo,
    };
    const formattedRecord = this.formatter.format(record);
    this.emit(JSON.parse(formattedRecord));
  }

  private emit(record: LogRecord): void {
    const headers = {
      'Api-Key': this.config.apiKey,
      'Content-Type': 'application/json',
    };

    const payload = {
      environment: this.config.environment,
      ...record,
    };

    const promise = this.sendLogToNewRelic(payload, headers);
    this.pendingPromises.push(promise);
  }

  private async sendLogToNewRelic(payload: Record<string, unknown>, headers: Record<string, string>): Promise<void> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await axios.post(this.config.endpointUrl, payload, {headers});
        return;
      } catch (error) {
        if (attempt === this.config.maxRetries) {
          console.error(
              `Failed to send log to New Relic after ${this.config.maxRetries} retries:`,
              error,
          );
        } else {
          await new Promise((resolve) =>
            setTimeout(resolve, attempt * this.config.backoffFactor * 1000),
          );
        }
      }
    }
  }
}

