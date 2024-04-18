// import {assert} from 'chai';
// import '@nomicfoundation/hardhat-ethers';
// import {ethers} from 'hardhat';
// import {HardhatEthersSigner} from '@nomicfoundation/hardhat-ethers/signers';
// import Liquidator from '../src/liquidator/liquidator';
// import DataSource from '../src/lib/DataSource';
// import { LoggerConsole } from '../../src/service/logger/LoggerConsole';

// describe('Liquidator Test', function() {
//   let logger: LoggerConsole;
//   let dataSource: DataSource;
//   let signer: HardhatEthersSigner;
//   let liquidator: Liquidator;

//   before(async function() {
    
//   });

//   beforeEach(async function() {
//     dataSource = new DataSource(logger);
//     liquidator = new Liquidator(signer, logger);
//     await liquidator.initialize();
//   });

//   it('Check liquidator answers', async function() {
//     const res = await dataSource.getLivePositions();

//     const latestBlock = await signer.provider?.getBlock('latest');

//     const {liquidatedCount, answers} = await liquidator.run(latestBlock!.timestamp);

//     // console.log(liquidatedCount, answers); // Debug

//     assert(answers.length === res.rows.length, 'Answers length is not equal to live positions amount');

//     const result = answers.reduce(
//         (acc, result) => {
//           if (result.status === 'fulfilled') {
//             acc.fulfilledCount++;
//           } else if (result.status === 'rejected') {
//             acc.rejectedCount++;
//           }
//           return acc;
//         },
//         {fulfilledCount: 0, rejectedCount: 0},
//     );
//     assert(liquidatedCount === result.fulfilledCount, 'Liquidated count is not equal to liquidated answers amount');
//   });
// });
