#!/bin/bash

set -o allexport && source .env.local && set +o allexport

docker run --network host -e HARDHAT_PORT=8545 -e ALCHEMY_API_KEY=$ALCHEMY_API_KEY -d --rm --name main-eth-node -p 8545:8545 arch-production-node:latest
docker run --network host -e HARDHAT_PORT=18545 -e ALCHEMY_API_KEY=$ALCHEMY_API_KEY -d --rm --name alt-eth-node -p 18545:18545 arch-production-node:latest

