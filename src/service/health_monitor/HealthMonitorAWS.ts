import {IHealthMonitor} from './IHealthMonitor';
import {CloudWatchClient, PutMetricDataCommand, PutMetricDataCommandInput} from '@aws-sdk/client-cloudwatch';
import {Logger} from '../logger/Logger';
import {ConfigService} from '../config/ConfigService';
import { HostNameProvider } from './HostNameProvider';

export class HealthMonitorAWS implements IHealthMonitor {
  private readonly cloudWatchClient: CloudWatchClient;
  private readonly logger: Logger;
  private readonly configService: ConfigService;
  private readonly hostNameProvider: HostNameProvider;
  private readonly metricNamespace: string;

  constructor(logger: Logger, configService: ConfigService, hostNameProvider: HostNameProvider) {
    this.cloudWatchClient = new CloudWatchClient({});
    this.logger = logger;
    this.configService = configService;
    this.hostNameProvider = hostNameProvider;
    this.metricNamespace = `${this.configService.getEnvironment()}/Groot/Heartbeat`;
  }

  public async sendHeartBeat(): Promise<boolean> {
    const metricData = this.createHeartbeatMetricData();
    const putMetricDataParams = this.createPutMetricDataParams(metricData);

    try {
      const response = await this.putMetricData(putMetricDataParams);
      return this.handlePutMetricDataResponse(response);
    } catch (error) {
      this.handlePutMetricDataError(error);
      return false;
    }
  }

  private createHeartbeatMetricData(): MetricData {
    return {
      MetricName: 'Heartbeat',
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

  private createPutMetricDataParams(metricData: MetricData): PutMetricDataCommandInput {
    return {
      MetricData: [metricData],
      Namespace: this.metricNamespace,
    };
  }

  private async putMetricData(params: PutMetricDataCommandInput): Promise<any> {
    const command = new PutMetricDataCommand(params);
    return this.cloudWatchClient.send(command);
  }

  private handlePutMetricDataResponse(response: any): boolean {
    if (response.$metadata.httpStatusCode !== 200) {
      this.logger.error(`Failed to send heartbeat metric. HTTP status code: ${response}`);
      return false;
    } else {
      this.logger.debug(`Heartbeat metric sent successfully. Response: ${JSON.stringify(response)}`);
      return true;
    }
  }

  private handlePutMetricDataError(error: any): void {
    this.logger.error(`Failed to send heartbeat metric. Error: ${error.message}`);
  }
}
