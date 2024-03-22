require('@nomiclabs/hardhat-waffle');
require('hardhat-deploy');

module.exports = {
  solidity: '0.8.21',
  networks: {
    hardhat: {
      hostname: '0.0.0.0',
    },
  },
};
