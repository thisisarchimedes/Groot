#!/bin/bash


curl --request POST \
     --url http://localhost:8545 \
     --header 'content-type: application/json' \
     --data '
{
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{
          "to": "0x7694cd972baa64018e5c6389740832e4c7f2ce9a",
          "data": "0x065e5360"
          }],
        "id": 1
}
'

