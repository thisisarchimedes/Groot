#!/bin/bash

npx hardhat node --max-memory 12288 --port $HARDHAT_PORT --fork https://eth-mainnet.g.alchemy.com/v2/$API_KEY_ALCHEMY
