import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {ErrorHealthMonitor, HealthMonitor} from '../../src/service/health_monitor/HealthMonitor';

chai.use(chaiAsPromised);
const {expect} = chai;

describe('Health Monitor tests', function() {
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  const logger: LoggerAdapter = new LoggerAdapter();

  let healthMonitor: HealthMonitor;

  beforeEach(async function() {
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    await localNodeAlchemy.startNode();
    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
    await localNodeInfura.startNode();

    healthMonitor = new HealthMonitor(logger, [localNodeAlchemy, localNodeInfura]);
  });

  afterEach(async function() {
    await localNodeAlchemy.stopNode();
    await localNodeInfura.stopNode();
  });

  it('Should be able to recover node that is currently unhealthy', async function() {
    localNodeAlchemy.setNodeHealthy(true);
    localNodeInfura.setNodeHealthy(false);
    localNodeInfura.setExpectRecoverToSucceed(true);

    await healthMonitor.checkBlockchainNodesHealth();

    expect(logger.getLatestInfoLogLine().includes(`Node ${localNodeInfura.getNodeName()} has been recovered`))
        .to.be.true;
    expect(localNodeInfura.isHealthy()).to.be.true;
    expect(localNodeAlchemy.isHealthy()).to.be.true;
  });

  it('Should throw if all nodes failed and cannot recover', async function() {
    localNodeAlchemy.setNodeHealthy(false);
    localNodeAlchemy.setExpectRecoverToSucceed(false);

    localNodeInfura.setNodeHealthy(false);
    localNodeAlchemy.setExpectRecoverToSucceed(false);

    await healthMonitor.checkBlockchainNodesHealth();

    await expect(healthMonitor.checkBlockchainNodesHealth()).to.be.rejectedWith(ErrorHealthMonitor);
  });
});
