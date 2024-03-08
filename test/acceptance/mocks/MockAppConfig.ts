import nock from 'nock';
import {Mock} from './Mock';
import {RuleJSONConfigItem, TypeRule} from '../../../src/rule_engine/TypesRule';

export class MockAppConfig extends Mock {
  private readonly awsAppConfigBaseUrl = 'https://appconfig.us-east-1.amazonaws.com';
  private readonly applicationId = 'DemoApp';
  private readonly environmentId = 'env';

  setupNock() {
    const grootRulesProfile = this.createGrootRulesProfile();
    this.setupGrootRulesNock(grootRulesProfile);
  }

  private createGrootRulesProfile(): RuleJSONConfigItem[] {
    return [
      {
        ruleType: TypeRule.Dummy,
        params: {
          message: 'I AM GROOT 1',
        },
      },
      {
        ruleType: TypeRule.Dummy,
        params: {
          message: 'I AM GROOT 2',
        },
      },
    ];
  }

  private setupGrootRulesNock(grootRulesProfile: RuleJSONConfigItem[]) {
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
