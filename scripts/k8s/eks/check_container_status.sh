#!/bin/bash

container_name=$1
deployment_name=$2

for i in {1..15}; do
  if ! kubectl get pods -l app=$deployment_name -o jsonpath='{.items[*].status.containerStatuses[?(@.name=="'$container_name'")].state.running}' | grep -q "running"; then
    echo "Container $container_name is not running"
    exit 1
  fi
  sleep 1
done

echo "Container $container_name is running"
exit 0