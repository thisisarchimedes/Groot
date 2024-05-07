# GROOT

## Setup & Environments

- **Local**: See [doc/LocalEnvironment.md](https://github.com/thisisarchimedes/Groot/blob/main/doc/LocalEnvironment.md)
- **CICD**: See [doc/CICDPipeline.md](https://github.com/thisisarchimedes/Groot/blob/main/doc/CICDPipeline.md)
  - **Observability**: [Pixie](https://github.com/thisisarchimedes/Groot/blob/main/doc/K8sObservability.md)
- **NewRelic**: [Raw logs](https://onenr.io/0Bj3XDql2QX)

## Supported Rules

[doc/RulesLogic.md](https://github.com/thisisarchimedes/Groot/blob/main/doc/RulesLogic.md)


## Tx broadcasting logic

[doc/TxLogic.md](https://github.com/thisisarchimedes/Groot/blob/main/doc/TxLogic.md)

## Troubleshooting

### Looks like our local nodes block number is ahead of the real network
You might be using our EC2 nodes as RPC url. These nodes auto generate 2 blocks per seconds
