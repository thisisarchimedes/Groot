import {IHealthMonitor} from './IHealthMonitor';
import os from 'os';
import {CloudWatchClient, PutMetricDataCommand} from '@aws-sdk/client-cloudwatch';

import {Logger} from '../logger/Logger';
import {ConfigServiceAWS} from '../config/ConfigServiceAWS';

export class HealthMonitorAWS implements IHealthMonitor {
  private readonly cloudWatchClient: CloudWatchClient;

  private readonly logger: Logger;
  private readonly configService: ConfigServiceAWS;
  private readonly hostingContainerName: string;
  private readonly environment: string;

  constructor(logger: Logger, configService: ConfigServiceAWS) {
    this.cloudWatchClient = new CloudWatchClient({});

    this.logger = logger;
    this.configService = configService;
    this.environment = this.configService.getEnvironment();

    this.hostingContainerName = os.hostname();
  }

  public async sendHeartBeat(): Promise<boolean> {
    const metricData = {
      MetricName: 'Heartbeat',
      Namespace: `${this.environment}/Groot/Heartbeat`,
      Timestamp: new Date(),
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        {
          Name: 'InstanceId',
          Value: this.hostingContainerName,
        },
      ],
    };

    const params = {
      MetricData: [metricData],
      Namespace: `${this.environment}/Groot/Heartbeat`,
    };

    try {
      const command = new PutMetricDataCommand(params);
      const response = await this.cloudWatchClient.send(command);

      if (response.$metadata.httpStatusCode !== 200) {
        this.logger.error(`Failed to send heartbeat metric. HTTP status code: ${response}`);
        return false;
      } else {
        this.logger.debug(`Heartbeat metric sent successfully. Response: ${JSON.stringify(response)}`);
        return true;
      }
    } catch (error) {
      this.logger.error(`Failed to send heartbeat metric. Error: ${error.message}`);
      return false;
    }
  }
}
