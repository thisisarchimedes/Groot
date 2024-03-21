#!/bin/bash

echo "Starting hardhat node..."
echo "HARDHAT_PORT: $HARDHAT_PORT"
echo "ALCHEMY_API_KEY: $ALCHEMY_API_KEY"

npx hardhat node --max-memory 12288 --fork https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY --port $HARDHAT_PORT 
