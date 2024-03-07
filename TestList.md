# Tests

## Node Reader
[X] Can get latest block number from a local running node
[X] Can spin a new node container
[X] Can kill a running container
[X] Can reset node and get a newer block number
[X] Can manage 2 nodes, get block number from both and return the latest
[X] Can facilitate read call, decide which node to use in case both response
[X] Can handle 1/2 node failed, use another node

**Refactor**

[X] Change console.log to log.debug
[X] Add new relic support to logger.ts
[] add more logging

## ConfigService
[X] Get RPCs from AWS AppConfig


## Rules Engine / Factory
[X] Create rule from dummy rule object
[X] Load rules from rule JSON and iterate on them, invoke each one
[] Add "group" to each rule and assign instance with a group number, make sure it only run rules under it's group 
[X] Collect all tx from executed rule and put them in an object, with urgency level and hash tx (for dedup)

## TxQueuer

[X] Get transactions from rules engine and filter all tx that don't have a hash + report on bad transaction (report context)
[X] Add transactions to queue and report with context on each tx sent


- Do dummy rule (that create NewRelic log line) and then do end-to-end deploy with Kubernetes


## Health Monitor
- probably want to check each node health flag and call recover. Do it once at the end of the test suite or if all nodes are down
[] When a nodes fails, can spin new nodes and use them 
[] Can handle all nodes failing, and report error and spin new nodes
[] Send pulse check to external watchdog service


## Tx Broadcaster (Seperate process)
[] Can sign a tx with the correct key without exposing the key (KMS)
[] Simulate transaction and report invalid without broadcasting it
[] Can broadcast an invalid transaction (test pass simulation) and report when it failed
[] Can boradcast a vaild transaction and report when it is successful
[] Can set priority level "fees" for a transaction normal/urgent based on current network conditions
[] Can re-broadcast if tx failed because PRC provider is down

# Architecture

[X] Run strategy and return tx - don't immediately broadcast. Have all tx and order them by priority, then broadcast
[X] Create production docker image that doesn't mine blocks

Main process
- start loop
    - Init objects
    - refresh config
    - Health monitor - start
    - Load rules 
    - Run roles
    - Do health monitoring on local nodes
    - Health monitor - done


- Rule has a JSON param.
- There is some kind of ABI repo

# Plan 

