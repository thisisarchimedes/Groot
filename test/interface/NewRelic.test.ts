import * as dotenv from 'dotenv';

import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {LoggerNewRelic} from '../../src/service/logger/LoggerNewRelic';
import {LoggerAll} from '../../src/service/logger/LoggerAll';

dotenv.config();

describe('Check that we work with NewRelic correctly', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let configService: ConfigServiceAWS;

  beforeEach(async function() {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    configService = new ConfigServiceAWS(environment, region);
    await configService.refreshConfig();
  });

  it('Should send a log line to New Relic', async function() {
    const logger = new LoggerNewRelic(configService, 'AcceptanceTest');
    logger.info('I AM GROOT');
    await logger.flush();
  });

  it('Should send a log line to New Relic and console', async function() {
    const logger = new LoggerAll(configService);
    logger.info('I AM GROOT - ALL');
    await logger.flush();
  });

  it('Should send cycle time to New Relic and console', async function() {
    const logger = new LoggerAll(configService);
    logger.reportCycleTime(1000);
    await logger.flush();
  });

  it('Should send rule eval results New Relic and console', async function() {
    const logger = new LoggerAll(configService);
    logger.reportRuleEvalResults(11, 3);
    await logger.flush();
  });
});
