#!/bin/bash

#call: build_container.sh $ENVIRONMENT $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY $AWS_REGION

AWS_ACCESS_KEY_ID=$1
AWS_SECRET_ACCESS_KEY=$2

echo "Building Groot"

docker pull node:20
docker build --no-cache --build-arg AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID --build-arg AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY -t groot-container -f scripts/container_main_groot/Dockerfile .

echo "Groot container built successfully"
