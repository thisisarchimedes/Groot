#!/bin/bash

set -o allexport && source .env.local && set +o allexport
unset KUBECONFIG

kind create cluster --name groot-cluster
kubectl create namespace groot

sudo ./scripts/container_main_groot/build_main_groot_container.sh
sudo ./scripts/container_reader_node/build_read_node_container.sh

# Load containers to Kind cluster
kind load docker-image groot-container:latest --name groot-cluster
kind load docker-image arch-production-node:latest --name groot-cluster

# Create secrets
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: aws-access-key-id
  namespace: groot
type: Opaque
stringData:
  AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
EOF

kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: aws-secret-access-key
  namespace: groot
type: Opaque
stringData:
  AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
EOF

kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: alchemy-api-key
  namespace: groot
type: Opaque
stringData:
  ALCHEMY_API_KEY: $ALCHEMY_API_KEY
EOF

# deploy pod
kubectl apply -f scripts/k8s/local/demoapp-configmap.yaml --namespace groot
kubectl apply -f scripts/k8s/local/deployment.yaml --namespace groot
kubectl apply -f scripts/k8s/local/service.yaml --namespace groot

kubectl get pods --namespace groot