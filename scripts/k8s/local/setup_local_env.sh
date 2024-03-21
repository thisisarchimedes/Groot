#!/bin/bash

set -o allexport && source .env.local && set +o allexport
unset KUBECONFIG

kind create cluster --name groot-cluster
kubectl create namespace groot

docker pull node:18
sudo docker build --no-cache -t arch-production-node scripts/container_reader_node/container_files/

docker pull node:20
sudo docker build --no-cache -t groot-container -f scripts/container_main_groot/Dockerfile .

# Load containers to Kind cluster
kind load docker-image groot-container --name groot-cluster
kind load docker-image arch-production-node --name groot-cluster

kubectl create secret generic aws-access-key-id --from-literal=AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
kubectl create secret generic aws-secret-access-key --from-literal=AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
kubectl create secret generic alchemy-api-key --from-literal=ALCHEMY_API_KEY=$ALCHEMY_API_KEY

 # deploy pod
kubectl apply -f scripts/k8s/local/demoapp-configmap.yaml
kubectl apply -f scripts/k8s/local/deployment.yaml
kubectl apply -f scripts/k8s/local/service.yaml
kubectl apply -f scripts/k8s/local/cronjob.yaml

 kubectl get pods
