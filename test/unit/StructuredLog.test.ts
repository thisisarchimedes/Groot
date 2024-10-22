import 'reflect-metadata';
import {expect} from 'chai';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {LogMessageCycleTime, RuleEvalResult} from '../../src/service/logger/TypeLogItem';

describe('Check that we build the structured log messages correctly', function() {
  let logger: LoggerAdapter;

  beforeEach(function() {
    logger = new LoggerAdapter();
  });

  it('should build cycle time log correctly', function() {
    const cycleTime: number = 1000;
    const expectedLogMessage: LogMessageCycleTime = {
      message: 'Cycle time (milliseconds)',
      cycleTime: cycleTime,
    };
    logger.reportCycleTime(cycleTime);
    const actualLogMessage = logger.getLatestInfoLogLine();
    expect(actualLogMessage === JSON.stringify(expectedLogMessage)).to.be.true;
  });

  it('should build rule eval report log correctly', function() {
    const successes: number = 10;
    const failures: number = 2;
    const expectedLogMessage: RuleEvalResult = {
      message: 'Rule Eval Results',
      successfulRuleEval: successes,
      failedRuleEval: failures,
    };
    logger.reportRuleEvalResults(successes, failures);
    const actualLogMessage = logger.getLatestInfoLogLine();
    expect(actualLogMessage === JSON.stringify(expectedLogMessage)).to.be.true;
  });
});
