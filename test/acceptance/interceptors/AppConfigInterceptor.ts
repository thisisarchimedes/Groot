import nock from 'nock';
import {Interceptor} from './Interceptor';
import {RuleJSONConfigItem} from '../../../src/rule_engine/TypesRule';
import {namespace} from '../../../src/constants/constants';

export class AppConfigInterceptor extends Interceptor {
  private readonly awsAppConfigBaseUrl =
    'https://appconfig.us-east-1.amazonaws.com';
  private readonly applicationId = 'DemoApp';
  private readonly environmentId = 'env';

  public setupGrootRulesNock(
      grootRulesProfile: RuleJSONConfigItem[] = [],
  ): void {
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
    for (const rule of grootRulesProfile) {
      if (rule.params.slippagePercentage) {
        rule.params.slippagePercentage = Number(rule.params.slippagePercentage);
      }
    }

    nock(this.awsAppConfigBaseUrl, options)
        .persist()
        .get(url)
        .query({
          client_id: namespace,
        })
        .reply(200, grootRulesProfile);
  }
}
