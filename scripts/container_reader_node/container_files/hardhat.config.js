require("@nomiclabs/hardhat-waffle");
require('hardhat-deploy');

const ALCHEMY_RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/' + 'API_KEY_ALCHEMY';

module.exports = {
    solidity: "0.8.21",
    networks: {
      hardhat: {
        hostname: '0.0.0.0',
        forking: {
          url: ALCHEMY_RPC_URL,
        },
      },
    },
  };
  