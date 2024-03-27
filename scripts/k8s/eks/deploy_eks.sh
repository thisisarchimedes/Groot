#!/bin/bash

# EXAMPLE: deploy_eks.sh configmap-demoapp.yaml

if [ -z "$1" ]; then
  echo "Error: No configmap argument supplied. Exiting."
  exit 1
fi

CONFIG_FILE_NAME=$1 

# Update kubeconfig
aws eks update-kubeconfig --name groot-demo-app --region $EKS_REGION
                    
# Create the groot namespace if it doesn't exist
kubectl apply -f scripts/k8s/eks/namespace.yaml --dry-run=client -o yaml | kubectl apply -f -
          
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

kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: newrelic-api-key
  namespace: groot
type: Opaque
stringData:
  NEW_RELIC_API_KEY: $NEW_RELIC_API_KEY
EOF
          
# Deploy or update Kubernetes manifests
kubectl apply -f scripts/k8s/eks/$CONFIG_FILE_NAME --namespace groot
kubectl apply -f scripts/k8s/eks/deployment.yaml --namespace groot
kubectl apply -f scripts/k8s/eks/service.yaml --namespace groot

# Trigger a rolling restart of the deployment
kubectl rollout restart deployment/groot-deployment --namespace groot
        
# Verify deployment
kubectl get pods --namespace groot