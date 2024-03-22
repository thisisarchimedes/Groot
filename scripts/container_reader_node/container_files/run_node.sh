#!/bin/bash

echo "Starting hardhat node on port $HARDHAT_PORT"

npx hardhat node --max-memory 12288 --fork https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY --hostname 0.0.0.0 --port $HARDHAT_PORT 
