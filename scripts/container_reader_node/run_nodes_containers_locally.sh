#!/bin/bash

docker run -d --rm --name main-eth-node -p 8545:8545 arch-production-node:latest
docker run -d --rm --name alt-eth-node -p 8546:8545 arch-production-node:latest