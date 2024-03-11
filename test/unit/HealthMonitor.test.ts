import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {
  BlockchainNodeHealthMonitor,
  ErrorBlockchainNodeHealthMonitor,
} from '../../src/service/health_monitor/BlockchainNodeHealthMonitor';
import {HealthMonitor} from '../../src/service/health_monitor/HealthMonitor';
import {SignalAdapter} from './adapters/SignalAdapter';

chai.use(chaiAsPromised);
const {expect} = chai;

describe('Health Monitor tests', function() {
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  const logger: LoggerAdapter = new LoggerAdapter();

  let blockchainNodeHealth: BlockchainNodeHealthMonitor;

  beforeEach(async function() {
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    await localNodeAlchemy.startNode();
    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
    await localNodeInfura.startNode();

    blockchainNodeHealth = new BlockchainNodeHealthMonitor(logger, [localNodeAlchemy, localNodeInfura]);
  });

  afterEach(async function() {
    await localNodeAlchemy.stopNode();
    await localNodeInfura.stopNode();
  });

  it('Should be able to recover node that is currently unhealthy', async function() {
    localNodeAlchemy.setNodeHealthy(true);
    localNodeInfura.setNodeHealthy(false);
    localNodeInfura.setExpectRecoverToSucceed(true);

    await blockchainNodeHealth.checkBlockchainNodesHealth();

    expect(logger.getLatestInfoLogLine().includes(`Node ${localNodeInfura.getNodeName()} has been recovered`))
        .to.be.true;
    expect(localNodeInfura.isHealthy()).to.be.true;
    expect(localNodeAlchemy.isHealthy()).to.be.true;
  });

  it('Should throw if all nodes failed and cannot recover', async function() {
    localNodeAlchemy.setNodeHealthy(false);
    localNodeAlchemy.setExpectRecoverToSucceed(false);

    localNodeInfura.setNodeHealthy(false);
    localNodeInfura.setExpectRecoverToSucceed(false);

    await expect(blockchainNodeHealth.checkBlockchainNodesHealth())
        .to.be.rejectedWith(ErrorBlockchainNodeHealthMonitor);
  });

  it('Should correctly invoke Health Monitor start of cycle sequence', async function() {
    localNodeAlchemy.setNodeHealthy(true);
    localNodeInfura.setNodeHealthy(true);

    const signalHeartbeat: SignalAdapter = new SignalAdapter();
    const signalCriticalFailure: SignalAdapter = new SignalAdapter();

    const healthMonitor: HealthMonitor = new HealthMonitor(
        logger, blockchainNodeHealth, signalHeartbeat, signalCriticalFailure);

    await healthMonitor.startOfCycleSequence();

    expect(signalHeartbeat.isHeartbeatSent()).to.be.true;
    expect(signalCriticalFailure.isCriticalFailureSent()).to.be.false;
  });

  it('Should correctly invoke Health Monitor start of cycle and send critical failure', async function() {
    localNodeAlchemy.setNodeHealthy(false);
    localNodeAlchemy.setExpectRecoverToSucceed(false);

    localNodeInfura.setNodeHealthy(false);
    localNodeInfura.setExpectRecoverToSucceed(false);

    const signalHeartbeat: SignalAdapter = new SignalAdapter();
    const signalCriticalFailure: SignalAdapter = new SignalAdapter();

    const healthMonitor: HealthMonitor = new HealthMonitor(
        logger, blockchainNodeHealth, signalHeartbeat, signalCriticalFailure);

    await healthMonitor.startOfCycleSequence();

    expect(signalHeartbeat.isHeartbeatSent()).to.be.true;
    expect(signalCriticalFailure.isCriticalFailureSent()).to.be.true;
  });

  it('Should correctly invoke Health Monitor end of cycle and report on cycle time', async function() {
    const signalHeartbeat: SignalAdapter = new SignalAdapter();
    const signalCriticalFailure: SignalAdapter = new SignalAdapter();

    const healthMonitor: HealthMonitor = new HealthMonitor(
        logger, blockchainNodeHealth, signalHeartbeat, signalCriticalFailure);

    await healthMonitor.startOfCycleSequence();
    healthMonitor.endOfCycleSequence();

    expect(signalHeartbeat.isHeartbeatSent()).to.be.true;
    expect(signalCriticalFailure.isCriticalFailureSent()).to.be.false;
    expect(logger.getLatestInfoLogLine().includes('Cycle completed - time:')).to.be.true;
  });
});
