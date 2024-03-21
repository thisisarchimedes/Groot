#!/bin/bash

# Set AWS credentials
aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY

# Set the default AWS region (optional)
aws configure set default.region $AWS_REGION

# Start the main.ts script
yarn tsx src/main.ts