# GROOT

- we are using Yarn
- lint
- build

- desciption of the production node and build_docker


FAQ
- Make sure there isn't old  Docker images under the same name locally 


CloudWatch Heartbeat Event
`DemoApp/Groot/Heartbeat`


## Run Locally

_*Install dependencies*_
1. Make sure Node.js and Yarn are installed
2. Install requirements: `yarn install`

_*Get .env file*_
```bash
yarn dotenvx hub login
yarn dotenvx hub open # open and follow the link printed, copy the keys to .env.keys locally
set -o allexport && source .env.keys && set +o allexport # export .env.keys to local environment
yarn dotenvx decrypt # decrypt .env.vault to .env
set -o allexport && source .env && set +o allexport # export .env to local environment
```

_*Update .env*_
```bash
yarn dotenvx encrypt
yarn dotenvx hub push # push the keys to the dotenvx hub
```
Next: 
- commit `.env.vault` to github _**DO NOT COMMIT .evn.keys or .env to github**_
- Update the repo Github Secrets `DOTENV_KEY`



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
