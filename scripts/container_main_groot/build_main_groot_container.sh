#!/bin/bash

echo "Building Groot"

docker pull node:20
docker build --no-cache --build-arg -t groot-container -f scripts/container_main_groot/Dockerfile .

echo "Groot container built successfully"
