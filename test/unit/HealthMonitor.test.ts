import 'reflect-metadata';

import * as chai from 'chai';

import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {
  BlockchainNodeHealthMonitor,
  ErrorBlockchainNodeHealthMonitor,
} from '../../src/service/health_monitor/BlockchainNodeHealthMonitor';
import {HealthMonitor} from '../../src/service/health_monitor/HealthMonitor';
import {SignalAdapter} from './adapters/SignalAdapter';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {ModulesParams} from '../../src/types/ModulesParams';

const {expect} = chai;

const should = chai.should();


describe('Health Monitor tests', function() {
  const modulesParams: ModulesParams = {};

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    modulesParams.logger = new LoggerAdapter();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeAdapter(modulesParams, 'localNodeAlchemy');
    modulesParams.altNode = new BlockchainNodeAdapter(modulesParams, 'localNodeInfura');
    Promise.all([modulesParams.mainNode!.startNode(), modulesParams.altNode!.startNode()]);

    modulesParams.blockchainNodeHealthMonitor = new BlockchainNodeHealthMonitor(modulesParams);
  });

  afterEach(async function() {
    await modulesParams.mainNode!.stopNode();
    await modulesParams.altNode!.stopNode();
  });

  it('Should be able to recover node that is currently unhealthy', async function() {
    (modulesParams.mainNode! as BlockchainNodeAdapter).setNodeHealthy(true);
    (modulesParams.altNode! as BlockchainNodeAdapter).setNodeHealthy(false);
    (modulesParams.altNode! as BlockchainNodeAdapter).setExpectRecoverToSucceed(true);

    await modulesParams.blockchainNodeHealthMonitor!.checkBlockchainNodesHealth();
    const loggLastLine = (modulesParams.logger! as LoggerAdapter).getLatestInfoLogLine();
    expect(
        loggLastLine.includes(
            `Node ${(modulesParams.altNode! as BlockchainNodeAdapter).getNodeName()} has been recovered`,
        ),
    )
        .to.be.true;
    expect((modulesParams.altNode! as BlockchainNodeAdapter).isHealthy()).to.be.true;
    expect((modulesParams.mainNode! as BlockchainNodeAdapter).isHealthy()).to.be.true;
  });

  it('Should throw if all nodes failed and cannot recover', async function() {
    (modulesParams.mainNode! as BlockchainNodeAdapter).setNodeHealthy(false);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setExpectRecoverToSucceed(false);
    (modulesParams.altNode! as BlockchainNodeAdapter).setNodeHealthy(false);
    (modulesParams.altNode! as BlockchainNodeAdapter).setExpectRecoverToSucceed(false);

    try {
      await modulesParams.blockchainNodeHealthMonitor!.checkBlockchainNodesHealth();
      should.fail('Expected method to reject');
    } catch (error) {
      const errorInstance = error as ErrorBlockchainNodeHealthMonitor;
      errorInstance.should.be.an.instanceOf(ErrorBlockchainNodeHealthMonitor);
    }
  });

  it('Should correctly invoke Health Monitor start of cycle sequence', async function() {
    (modulesParams.mainNode! as BlockchainNodeAdapter).setNodeHealthy(true);
    (modulesParams.altNode! as BlockchainNodeAdapter).setNodeHealthy(true);

    modulesParams.signalHeartbeat = new SignalAdapter();
    modulesParams.signalCriticalFailure = new SignalAdapter();

    modulesParams.healthMonitor = new HealthMonitor(
        modulesParams);

    await modulesParams.healthMonitor.startOfCycleSequence();

    expect((modulesParams.signalHeartbeat as SignalAdapter).isHeartbeatSent()).to.be.true;
    expect((modulesParams.signalCriticalFailure as SignalAdapter).isCriticalFailureSent()).to.be.false;
  });

  it('Should correctly invoke Health Monitor start of cycle and send critical failure', async function() {
    (modulesParams.mainNode! as BlockchainNodeAdapter).setNodeHealthy(false);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setExpectRecoverToSucceed(false);

    (modulesParams.altNode! as BlockchainNodeAdapter).setNodeHealthy(false);
    (modulesParams.altNode! as BlockchainNodeAdapter).setExpectRecoverToSucceed(false);

    modulesParams. signalHeartbeat = new SignalAdapter();
    modulesParams. signalCriticalFailure = new SignalAdapter();

    modulesParams. healthMonitor = new HealthMonitor(
        modulesParams);

    await modulesParams.healthMonitor.startOfCycleSequence();

    expect((modulesParams.signalHeartbeat as SignalAdapter).isHeartbeatSent()).to.be.true;
    expect((modulesParams.signalCriticalFailure as SignalAdapter).isCriticalFailureSent()).to.be.true;
  });

  it('Should correctly invoke Health Monitor end of cycle and report on cycle time', async function() {
    modulesParams. signalHeartbeat = new SignalAdapter();
    modulesParams. signalCriticalFailure = new SignalAdapter();

    modulesParams. healthMonitor = new HealthMonitor(
        modulesParams);

    await modulesParams.healthMonitor.startOfCycleSequence();
    modulesParams.healthMonitor.endOfCycleSequence();

    expect((modulesParams.signalHeartbeat as SignalAdapter).isHeartbeatSent()).to.be.true;
    expect((modulesParams.signalCriticalFailure as SignalAdapter).isCriticalFailureSent()).to.be.false;
    expect((modulesParams.logger as LoggerAdapter).getLatestInfoLogLine().includes('Cycle time')).to.be.true;
  });
});
