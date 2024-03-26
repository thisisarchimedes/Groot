#!/bin/bash

echo "Building Groot"

docker pull node:20
docker build --no-cache -t groot-container:latest -f scripts/container_main_groot/container_files/Dockerfile .

echo "Groot container built successfully"
