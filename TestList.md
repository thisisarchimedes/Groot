# Tests

## Node Reader
[X] Can get latest block number from a local running node
[X] Can spin a new node container
[X] Can kill a running container
[X] Can reset node and get a newer block number
[] Can manage 2 nodes, and decide which one is more up to date
[] Can facilitate read call, decide which node to use
[] Can handle node failuire, and switch to another node, kill the old one and spin a new backup node
[] Can handle all nodes failing, and report error and spin new nodes

**Refactor**

[] Change console.log to log.debug

## Tx Broadcaster

[] Can sign a tx with the correct key without exposing the key (KMS)
[] Simulate transaction and report invalid without broadcasting it
[] Can broadcast an invalid transaction (test pass simulation) and report when it failed
[] Can boradcast a vaild transaction and report when it is successful
[] Can set priority level for a transaction low/medium/high based on current network conditions
[] Can re-broadcast if tx failed because PRC provider is down

**Refactor**

## Rules Engine

**Refactor**

# Architecture

- Run strategy and return tx - don't immediately broadcast. Have all tx and order them by priority, then broadcast
- Create production docker image that doesn't mine blocks