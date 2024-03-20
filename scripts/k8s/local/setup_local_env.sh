#!/bin/bash

set -o allexport && source .env.local && set +o allexport
unset KUBECONFIG

kind create cluster --name groot-cluster
kubectl create namespace groot

sudo ./scripts/container_reader_node/build_read_node_container.sh $API_KEY_ALCHEMY
sudo ./scripts/container_main_groot/build_main_groot_container.sh $ENVIRONMENT $DOCKER_IMAGE_NAME $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY $AWS_REGION

# Load containers to Kind cluster
kind load docker-image groot-container --name groot-cluster
kind load docker-image arch-production-node:latest --name groot-cluster

 # deploy pod
kubectl apply -f scripts/k8s/local/demoapp-configmap.yaml
kubectl apply -f scripts/k8s/local/deployment.yaml
kubectl apply -f scripts/k8s/local/service.yaml
kubectl apply -f scripts/k8s/local/cronjob.yaml


 kubectl get pods
