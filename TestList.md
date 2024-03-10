# Tests

## Health Monitor
[X] Send heart beat to external watchdog service
[] Check node health and spin new container if needed
[] Should be able to invoke an overall reset if cannot recover (send a "need reset" event)

- Add Health monitor to main flow

## Tx Broadcaster (Seperate process)
[] Can sign a tx with the correct key without exposing the key (KMS)
[] Simulate transaction and report invalid without broadcasting it
[] Can broadcast an invalid transaction (test pass simulation) and report when it failed
[] Can boradcast a vaild transaction and report when it is successful
[] Can set priority level "fees" for a transaction normal/urgent based on current network conditions
[] Can re-broadcast if tx failed because PRC provider is down

# Architecture
[] There is some kind of ABI repo
[] add more logging
[] Add "group" to each rule and assign instance with a group number, make sure it only run rules under it's group 

- probably want to check each node health flag and call recover. Do it once at the end of the test suite or if all nodes are down
- TODO: Implement the actual TxQueue class
- Build pipeline
    - Pack everything in a container and use AWS Fargate to manage it

[] Change Rules to push/pop model and support more than one tx

# Plan 

- CloudWatch Event: DemoApp/Groot/Heartbeat - when spining container add a heartbeat event to CloudWatch
