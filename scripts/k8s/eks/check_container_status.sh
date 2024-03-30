#!/bin/bash

container_name=$1
deployment_name=$2

# Step 1: Wait for the container to start running (up to 5 minutes)
echo "Waiting for container $container_name to start running..."
for i in {1..30}; do
  if kubectl get pods -l app=$deployment_name -o jsonpath='{.items[*].status.containerStatuses[?(@.name=="'$container_name'")].state.running}' | grep -q "running"; then
    echo "Container $container_name is running"
    break
  fi
  
  if [ $i -eq 30 ]; then
    echo "Timed out waiting for container $container_name to start running"
    exit 1
  fi
  
  sleep 10
done

# Step 2: Ensure the container stays running for 15 seconds
echo "Ensuring container $container_name stays running for 15 seconds..."
for i in {1..15}; do
  if ! kubectl get pods -l app=$deployment_name -o jsonpath='{.items[*].status.containerStatuses[?(@.name=="'$container_name'")].state.running}' | grep -q "running"; then
    echo "Container $container_name stopped running"
    exit 1
  fi
  sleep 1
done

echo "Container $container_name is running and stable"
exit 0