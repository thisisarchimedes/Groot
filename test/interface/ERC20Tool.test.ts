import {expect} from 'chai';

import * as dotenv from 'dotenv';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeRemoteRPC} from '../../src/blockchain/blockchain_nodes/BlockchainNodeRemoteRPC';
import {LoggerConsole} from '../../src/service/logger/LoggerConsole';
import {ERC20Tool} from '../../src/rule_engine/tool/contracts/ERC20';
import {WBTC} from '../../src/constants/addresses';
dotenv.config();

describe('erc20 interface', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(12000);

  let blockchainReader: BlockchainReader;
  let erc20Tool: ERC20Tool;

  beforeEach(function() {
    const apiKeyAlchemy = process.env.API_KEY_ALCHEMY;

    // LoggerConsole
    // BlockchainNodeRemoteRPC
    const mainNode = new BlockchainNodeRemoteRPC(
        new LoggerConsole(),
        `https://eth-mainnet.alchemyapi.io/v2/${apiKeyAlchemy}`,
        'alchemyNode',
    );
    const altNode = new BlockchainNodeRemoteRPC(
        new LoggerConsole(),
        `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        'infuraNode',
    );

    blockchainReader = new BlockchainReader({
      mainNode: mainNode,
      altNode: altNode,
    });
    erc20Tool = new ERC20Tool(blockchainReader);
  });

  it('should fetch the decimals of a token', async function() {
    const decimals = await erc20Tool.decimals(WBTC);
    expect(decimals).to.be.a('bigint');
  });
});
