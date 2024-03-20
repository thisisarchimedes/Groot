#!/bin/bash

#call: build_container.sh $ENVIRONMENT $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY $AWS_REGION

ENVIRONMENT=$1
AWS_ACCESS_KEY_ID=$2
AWS_SECRET_ACCESS_KEY=$3
AWS_REGION=$4

echo "Building Groot at ENVIRONMENT: $ENVIRONMENT & REGION: $AWS_REGION"

script_dir="$(dirname "$0")"

# Create .env file in the script directory
env_file="$script_dir/container_files/.env"

# Write environment variables to the .env file
echo "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" > $env_file
echo "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" >> $env_file

echo ".env file created at: $env_file"

docker pull node:20
docker build --no-cache -t groot-container -f scripts/container_main_groot/Dockerfile .
rm $env_file
