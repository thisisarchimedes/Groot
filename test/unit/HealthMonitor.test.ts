import 'reflect-metadata';

import * as chai from 'chai';

import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import {
  ErrorBlockchainNodeHealthMonitor,
} from '../../src/service/health_monitor/BlockchainNodeHealthMonitor';
import { HealthMonitor } from '../../src/service/health_monitor/HealthMonitor';
import { SignalAdapter } from './adapters/SignalAdapter';
import { Container } from 'inversify';
import { TYPES } from '../../src/inversify.types';
import { IBlockchainNodeHealthMonitor } from '../../src/service/health_monitor/interfaces/BlockchainNodeHealthMonitor';
import { createTestContainer } from './inversify.config.unit_test';

const { expect } = chai;

const should = chai.should();


describe('Health Monitor tests', function () {
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let container: Container;
  let blockchainNodeHealth: IBlockchainNodeHealthMonitor;
  let logger: LoggerAdapter;
  beforeEach(async function () {
    container = createTestContainer();
    // Starting nodes
    logger = container.get<LoggerAdapter>(LoggerAdapter);
    localNodeAlchemy = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain);
    localNodeInfura = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt);
    Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);

    blockchainNodeHealth = container.get<IBlockchainNodeHealthMonitor>(TYPES.IBlockchainNodeHealthMonitor);
  });

  afterEach(async function () {
    await localNodeAlchemy.stopNode();
    await localNodeInfura.stopNode();
  });

  it('Should be able to recover node that is currently unhealthy', async function () {
    localNodeAlchemy.setNodeHealthy(true);
    localNodeInfura.setNodeHealthy(false);
    localNodeInfura.setExpectRecoverToSucceed(true);

    await blockchainNodeHealth.checkBlockchainNodesHealth();
    const loggLastLine = logger.getLatestInfoLogLine();
    expect(loggLastLine.includes(`Node ${localNodeInfura.getNodeName()} has been recovered`))
      .to.be.true;
    expect(localNodeInfura.isHealthy()).to.be.true;
    expect(localNodeAlchemy.isHealthy()).to.be.true;
  });

  it('Should throw if all nodes failed and cannot recover', async function () {
    localNodeAlchemy.setNodeHealthy(false);
    localNodeAlchemy.setExpectRecoverToSucceed(false);
    localNodeInfura.setNodeHealthy(false);
    localNodeInfura.setExpectRecoverToSucceed(false);

    try {
      await blockchainNodeHealth.checkBlockchainNodesHealth();
      should.fail('Expected method to reject');
    } catch (error) {
      const errorInstance = error as ErrorBlockchainNodeHealthMonitor;
      errorInstance.should.be.an.instanceOf(ErrorBlockchainNodeHealthMonitor);
    }
  });

  it('Should correctly invoke Health Monitor start of cycle sequence', async function () {
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

  it('Should correctly invoke Health Monitor start of cycle and send critical failure', async function () {
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

  it('Should correctly invoke Health Monitor end of cycle and report on cycle time', async function () {
    const signalHeartbeat: SignalAdapter = new SignalAdapter();
    const signalCriticalFailure: SignalAdapter = new SignalAdapter();

    const healthMonitor: HealthMonitor = new HealthMonitor(
      logger, blockchainNodeHealth, signalHeartbeat, signalCriticalFailure);

    await healthMonitor.startOfCycleSequence();
    healthMonitor.endOfCycleSequence();

    expect(signalHeartbeat.isHeartbeatSent()).to.be.true;
    expect(signalCriticalFailure.isCriticalFailureSent()).to.be.false;
    expect(logger.getLatestInfoLogLine().includes('Cycle time')).to.be.true;
  });
});
