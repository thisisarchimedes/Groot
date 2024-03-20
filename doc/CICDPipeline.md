# Continuous Deployment Pipeline

## Overview

The pipeline meant to provide fast feedback and run tests to increase confidence. If all test pass, there is nothing more to do, and we can release.

Reference: 
- https://dojoconsortium.org/docs/cd/
- https://dojoconsortium.org/docs/testing/

## Stages

### Commit stage

Invoked automatically when a commit is pushed to the repository. The commit stage runs unit test.

### Acceptance stage

Invoked when a PR is opened. Runs Acceptance and Interface tests.
We'll add E2E* and other tests later.

* E2E are expensive and tend to be flaky - we only have a few happy path E2E test. With acceptance and unit in place, the big missing piece is increasing confidence that the code actually runs in production environment and is stable.

### Deployment stage

If Commit & Aceeptance stages are green, it means there is nothing else needed. We deploy to production

## Environments

We run on AWS EKS w/Fargate. Pod has the following containers
- **Groot main process**: Using K8s chron to run every minute
- **2 x Hardhat nodes (read only)**

### Current K8s clusters
- Cluster: groot-demo-app (us-west-1)
- ECR Repo: groot (us-west-1)

## Getting Basic Cluster Information

_*Before you begin*_
From local environment, make sure aws cli is installed and configured with the right credentials. Also install `kubectl`.
Then, authenicate and make sure you can get the cluster information.

```bash
aws eks update-kubeconfig --name groot-demo-app --region us-west-1
kubectl get pods --all-namespaces
```

Get all pods
```bash
kubectl get pods -n default
```

Get pod info & logs
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

