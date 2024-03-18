

- Kind
- Docker Desktop
 kind load docker-image groot-container --name groot-cluster
- kubectl apply -f deployment.yaml   

-  kind create cluster --name groot-cluster

kubectl create namespace groop

----

# K8

## Install

- Docker Desktop
- Kind
- kubectl
- Helm


### Kind
- kind create cluster --name groot-cluster
- create namespace - kubectl create namespace groop
- create cluster: kind create cluster --name groot-cluster 
- Loand container to cluster
    - kind load docker-image groot-container --name groot-cluster
    - kind load docker-image arch-production-node:latest --name groot-cluster
- deploy pod
    - kubectl apply -f service.yaml
    - kubectl apply -f deployment.yaml
- kubectl get pods

# no K8
./scripts/container_reader_node/run_nodes_containers_locally.sh


-- Commit stage to pass
-- Remove hardcoded node URL
-- Mockoon to pod and test locally