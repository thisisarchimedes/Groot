#!/bin/bash

#call: build_container.sh $ENVIRONMENT $DOCKER_IMAGE_NAME $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY $AWS_REGION

ENVIRONMENT=$1
DOCKER_IMAGE_NAME=$2
AWS_ACCESS_KEY_ID=$3
AWS_SECRET_ACCESS_KEY=$4
AWS_REGION=$5

echo "Building Groot at ENVIRONMENT: $ENVIRONMENT & REGION: $AWS_REGION"

script_dir="$(dirname "$0")"

# Create .env file in the script directory
env_file="$script_dir/container_files/.env"

# Write environment variables to the .env file
echo "ENVIRONMENT=$ENVIRONMENT" > "$env_file"
echo "DOCKER_IMAGE_NAME=$DOCKER_IMAGE_NAME" >> "$env_file"
echo "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" >> "$env_file"
echo "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" >> "$env_file"
echo "AWS_REGION=$AWS_REGION" >> "$env_file"

echo ".env file created at: $env_file"

docker pull node:20
docker build --no-cache -t groot-container -f scripts/container_main_groot/Dockerfile .
rm $env_file



