import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';

import {LoggerNewRelic} from '../../src/service/logger/LoggerNewRelic';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';

chai.use(chaiAsPromised);
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
});
