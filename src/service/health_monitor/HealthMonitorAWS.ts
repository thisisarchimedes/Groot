import { IHealthMonitor } from './IHealthMonitor';
import os from 'os';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

import { Logger } from '../logger/Logger';

export class HealthMonitorAWS implements IHealthMonitor {
  private readonly hostingContainerName: string;
  private readonly logger: Logger;
  private readonly cloudWatchClient: CloudWatchClient;

  constructor(logger: Logger) {
    this.hostingContainerName = os.hostname();
    this.logger = logger;
    this.cloudWatchClient = new CloudWatchClient({});
  }

  public async sendHeartBeat(): Promise<void> {
    const metricData = {
      MetricName: 'Heartbeat',
      Namespace: 'Groot/Heartbeat',
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
      Namespace: 'Groot/Heartbeat',
    };

    try {
      const command = new PutMetricDataCommand(params);
      const response = await this.cloudWatchClient.send(command);
      this.logger.debug(`Heartbeat metric sent successfully. Response: ${JSON.stringify(response)}`);
    } catch (error) {
      this.logger.error(`Failed to send heartbeat metric. Error: ${error.message}`);
    }
  }
}