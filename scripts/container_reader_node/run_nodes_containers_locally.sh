#!/bin/bash

docker run -e HARDHAT_PORT=8545 -d --rm --name main-eth-node -p 8545:8545 arch-production-node:latest
docker run -e HARDHAT_PORT=18545 -d --rm --name alt-eth-node -p 18545:18545 arch-production-node:latest