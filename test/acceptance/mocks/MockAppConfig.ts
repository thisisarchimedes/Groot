import nock from 'nock';
import {Mock} from './Mock';
import {RuleJSONConfigItem} from '../../../src/rule_engine/TypesRule';

export class MockAppConfig extends Mock {
  private readonly awsAppConfigBaseUrl = 'https://appconfig.us-east-1.amazonaws.com';
  private readonly applicationId = 'DemoApp';
  private readonly environmentId = 'env';

  public setupGrootRulesNock(grootRulesProfile: RuleJSONConfigItem[] = []): void {
    const headers = {
      'x-amz-user-agent': /.+/,
      'user-agent': /.+/,
      'amz-sdk-invocation-id': /.+/,
      'amz-sdk-request': /.+/,
      'x-amz-date': /.+/,
      'x-amz-content-sha256': /.+/,
      'authorization': /.+/,
    };

    const options = {
      reqheaders: headers,
      allowUnmocked: true,
    };

    const url = `/applications/${this.applicationId}/environments/${this.environmentId}/configurations/GrootRules`;

    nock(this.awsAppConfigBaseUrl, options)
        .persist()
        .get(url)
        .query({
          client_id: 'Groot',
        })
        .reply(200, grootRulesProfile);
  }

  cleanupNock() {
    nock.cleanAll();
  }
}
