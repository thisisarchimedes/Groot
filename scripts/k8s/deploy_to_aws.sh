#!/bin/bash

# point kubectl to the AWS EKS cluster
aws eks update-kubeconfig --name groot-production --region us-east-2

# verify the context is set to the AWS EKS cluster
kubectl config current-context

# list all the contexts
kubectl config get-contexts

# switch context
kubectl config use-context <context-name>



brew tap weaveworks/tap
brew install weaveworks/tap/eksctl


========
- Create cluster: eksctl create cluster --name groot --region us-west-1 --fargate