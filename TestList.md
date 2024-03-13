# Tests

## ToolUniswap PSP

[] Interface test to make sure we know how to work with the strategy contract 

## Tx Broadcaster (Seperate process)
[] Can sign a tx with the correct key (KMS)
[] Send URGENT from Urgent key and NORMAL from Normal key
[] Simulate transaction and report invalid without broadcasting it
[] Can broadcast an invalid transaction (test pass simulation) and report when tx failed after broadcasting
[] Hold transaction status in a presistant storage: pending in mempool, success, failed
[] Can re-broadcast if tx failed because PRC provider is down
[] Can set priority level "fees" for a transaction normal/urgent based on current network conditions
[] Can dedup transaction. If it gets the same transaction twice. Should also look at pending and successful tx

## Acceptance Testing
[] Check that end of cycle works

# Refactor

# Architecture
[] Run stress test on Groot with 10K positions
[X] There is some kind of ABI repo
[] add more logging
[] Add "group" to each rule and assign instance with a group number, make sure it only run rules under it's group 

- TODO: Implement the actual TxQueue class

# CICD
[] Deploy to AWS Fargate
[] Add a build pipeline - Pack everything in a container and use AWS Fargate to manage it
[] CloudWatch Event: DemoApp/Groot/Heartbeat - when spining container add a heartbeat event to CloudWatch
