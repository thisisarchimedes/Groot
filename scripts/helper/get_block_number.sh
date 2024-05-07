#!/bin/bash


curl --request POST \
     --url http://localhost:8545 \
     --header 'content-type: application/json' \
     --data '
{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}
'