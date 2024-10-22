# Configure Local Dev Environment

Groot is running in a K8s pod: 1 Groot container + 2 ETH nodes containers.

- [Notes](#notes)
- [Initial Setup](#initial-setup)
    - [Get .env file](#get-env-file)
- [Running Unit Tests](#running-unit-tests)
- [Running node containers without K8s](#running-node-containers-without-k8s)
- [Setting up local K8s](#setting-up-local-k8s)

## Notes

- All scripts are assuming, they've been called from the Groot project root directory
- Test shortcuts
    - `yarn test:unit`
    - `yarn test:acceptance`
    - `yarn test:interface`
    - `yarn test:all`

## Initial Setup


- Make sure NodeJS and Yarn are installed locally
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- `yarn install`

### Get .env file

```bash
yarn dotenvx hub login
yarn dotenvx hub open # open and follow the link printed, copy the keys to .env.keys locally
set -o allexport && source .env.keys && set +o allexport # export .env.keys to local environment
yarn dotenvx decrypt # decrypt .env.vault to .env
set -o allexport && source .env.local && set +o allexport # export .env.local to local environment
```

#### Update .env

Do this only if you happen to update the .env.* and want to share it

```bash
yarn dotenvx encrypt
yarn dotenvx hub push # push the keys to the dotenvx hub
```
Next: 
- commit `.env.vault` to github _**DO NOT COMMIT .evn.keys or .env to github**_
- Update the repo Github Secrets `DOTENV_KEY`

## Running Unit Tests

Unit test currently don't require K8s.

```bash
yarn test:unit
```

## Running node containers without K8s

```bash
./scripts/container_reader_node/run_nodes_containers_locally.sh
```

## Setting up local K8s

- Install [Kind](https://kind.sigs.k8s.io/)
- Install [kubectl](https://kubernetes.io/docs/tasks/tools/)

The script below builds the containers and loads them to the local kind cluster.
```bash
 sudo ./scripts/k8s/local/setup_local_env.sh
```
## Running Acceptance Tests Locally

Acceptance test are a step above unit test. We only test the STU (system under test), so we still use mocks to set the state that we want. However, Acceptance tests only use the natrual interfaces of the STU (e.g. APIs).

To achieve that we use Nock to intercept the outgoing Groot calls and craft a response.

```bash
yarn test:acceptance
```

## Troubleshooting

### Kind cannot pull local Docker image

If hitting `ImagePullBackOff`:
1. SSH into kind control panel: `docker exec -it groot-cluster-control-plane bash`
2. Get list of images: `crictl images`

### Container is not working properly

Try to fetch logs:
- `kubectl logs -l app=groot-eth-nodes --all-containers --namespace groot`
- `kubectl logs -l app=groot-container --all-containers --namespace groot`