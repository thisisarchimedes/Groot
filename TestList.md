# Tests

## ToolUniswap PSP

[] Interface test to make sure we know how to work with the strategy contract 

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
