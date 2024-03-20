import {
  CloudWatchClient,
  PutMetricDataCommand,
  PutMetricDataCommandInput,
  PutMetricDataCommandOutput,
  MetricDatum,
} from '@aws-sdk/client-cloudwatch';

import { HostNameProvider } from '../HostNameProvider';
import { ILogger } from '../../logger/interfaces/ILogger';
import { IConfigService } from '../../config/interfaces/IConfigService';

export abstract class SignalAWS {
  protected readonly cloudWatchClient: CloudWatchClient;
  protected readonly logger: ILogger;
  protected readonly configService: IConfigService;
  protected readonly hostNameProvider: HostNameProvider;
  protected readonly metricNamespace: string;

  constructor(
    logger: ILogger,
    configService: IConfigService,
    hostNameProvider: HostNameProvider,
    metricNamespace: string,
  ) {
    this.cloudWatchClient = new CloudWatchClient({});
    this.logger = logger;
    this.configService = configService;
    this.hostNameProvider = hostNameProvider;
    this.metricNamespace = `${this.configService.getEnvironment()}/Groot/${metricNamespace}`;
  }

  protected async sendSignal(metricName: string): Promise<boolean> {
    const metricData = this.createMetricData(metricName);
    const putMetricDataParams = this.createPutMetricDataParams(metricData);

    try {
      const response = await this.putMetricData(putMetricDataParams);
      return this.handlePutMetricDataResponse(response, metricName);
    } catch (error) {
      this.handlePutMetricDataError(error as Error, metricName);
      return false;
    }
  }

  private createMetricData(metricName: string): MetricDatum {
    return {
      MetricName: metricName,
      Timestamp: new Date(),
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        {
          Name: 'InstanceId',
          Value: this.hostNameProvider.getHostName(),
        },
      ],
    };
  }

  private createPutMetricDataParams(metricData: MetricDatum): PutMetricDataCommandInput {
    return {
      MetricData: [metricData],
      Namespace: this.metricNamespace,
    };
  }

  private putMetricData(params: PutMetricDataCommandInput): Promise<PutMetricDataCommandOutput> {
    const command = new PutMetricDataCommand(params);
    return this.cloudWatchClient.send(command);
  }

  private handlePutMetricDataResponse(response: PutMetricDataCommandOutput, metricName: string): boolean {
    if (response.$metadata.httpStatusCode !== 200) {
      this.logger.error(`Failed to send ${metricName} metric. HTTP status code: ${response}`);
      return false;
    } else {
      this.logger.debug(`${metricName} metric sent successfully. Response: ${JSON.stringify(response)}`);
      return true;
    }
  }

  private handlePutMetricDataError(error: Error, metricName: string): void {
    this.logger.error(`Failed to send ${metricName} metric. Error: ${error.message}`);
  }
}
