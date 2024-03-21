#!/bin/bash

docker pull node:18
docker build --no-cache -t arch-production-node:latest scripts/container_reader_node/container_files/

echo "Docker image built successfully."
