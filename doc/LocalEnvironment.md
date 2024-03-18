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
 sudo ./scripts/k8s/setup_local_env.sh
```
