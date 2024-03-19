#!/bin/bash

# Check if Docker is installed and available
if ! command -v docker &> /dev/null; then
    echo "Docker could not be found. Please install Docker to continue."
    exit 1
fi

# Check for API_KEY_ALCHEMY argument
if [ -z "$1" ]; then
    echo "API_KEY_ALCHEMY was not provided as an argument. Exiting..."
    exit 1
else
    API_KEY_ALCHEMY="$1"
    echo "API_KEY_ALCHEMY is set to '$API_KEY_ALCHEMY'. Proceeding to build Docker image..."
fi


# Ensure container_files directory exists
if [ ! -d "scripts/container_reader_node/container_files" ]; then
    echo "container_files directory does not exist. Exiting..."
    exit 1
fi

# adding API_KEY - editing hardhat.config.js
#sed -i '' "s|+ 'API_KEY_ALCHEMY'|+ '$API_KEY_ALCHEMY'|g" scripts/container_reader_node/container_files/hardhat.config.js
sed -i "s|+ 'API_KEY_ALCHEMY'|+ '$API_KEY_ALCHEMY'|g" scripts/container_reader_node/container_files/hardhat.config.js


docker pull node:18
docker build --no-cache -t arch-production-node:latest scripts/container_reader_node/container_files/

# revert changes
#sed -i '' "s|+ '$API_KEY_ALCHEMY'|+ 'API_KEY_ALCHEMY'|g" scripts/container_reader_node/container_files/hardhat.config.js
sed -i "s|+ '$API_KEY_ALCHEMY'|+ 'API_KEY_ALCHEMY'|g" scripts/container_reader_node/container_files/hardhat.config.js

echo "Docker image built successfully."
