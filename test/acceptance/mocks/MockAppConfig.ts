import nock from 'nock';
import {Mock} from './Mock';

export class MockAppConfig extends Mock {
  private awsAppConfigBaseUrl: string;
  private applicationId: string;
  private environmentId: string;

  constructor() {
    super();
    this.awsAppConfigBaseUrl = 'https://appconfig.us-east-1.amazonaws.com';
    this.applicationId = 'DemoApp';
    this.environmentId = 'env';
  }

  setupNock() {
    const grootRulesProfile = [
      {
        ruleType: 'dummy',
        params: {
          message: 'I AM GROOT 1',
        },
      },
      {
        ruleType: 'dummy',
        params: {
          message: 'I AM GROOT 2',
        },
      },
    ];

    nock(this.awsAppConfigBaseUrl, {
      reqheaders: {
        'x-amz-user-agent': /.+/,
        'user-agent': /.+/,
        'amz-sdk-invocation-id': /.+/,
        'amz-sdk-request': /.+/,
        'x-amz-date': /.+/,
        'x-amz-content-sha256': /.+/,
        'authorization': /.+/,
      },
      allowUnmocked: true,
    })
        .get(`/applications/${this.applicationId}/environments/${this.environmentId}/configurations/GrootRules`)
        .query({
          client_id: 'Groot',
        })
        .reply(200, grootRulesProfile);
  }

  cleanupNock() {
    nock.cleanAll();
  }
}
