# Deduping
- We prefer to dedup on the DB. If not possible, we dedup on Tx executor
- A window where we dedup all similar txs (small window - aka {ttl} mins)
- Dedup permanently all the txs of non-complete status
- We don't want to run the same rule concurrently - Each rule once at a time

## Unique Key
- Unique key: The function call (including param vaule) - function(1,2,3,4)
    - Don't use param that are calculated by 3rd party (like LiFi or Uniswap quote)
    - Don't use param that are timestamp or blocknumber (or a function of these)
    - Don't use hash (hard to debug) - just plain textx

{
    Contract address (the contract we send tx to)
    Function Name (Liquidate, adjustOut etc...)
    For leverage contracts: NftID
} + ttl

TTL (example):
- for adjust out: 1 minutes
- for adjust in: 24 hours

# Key management
- At two MONITOR addresses per leverage and PSP contract (URGENT and NORMAL) - Need to add PSP contract support
- We are going to have one global URGENT for everything (because we are paying max fee and bundling tx) - so we have one address to worry about being funded status
- NORMAL can be either global or contract specific - backend should support that via configuration
- We are going to store the private key in KMS

# Other
- Simulate transaction and report invalid without broadcasting it
- If broadcast an invalid transaction (pass simulation but revert on mainnet), report when tx failed after broadcasting
- Hold transaction status in a presistant storage: pending in mempool, success, failed
- Can re-broadcast if tx failed because PRC provider is down
- Set the correct priority level "fees" for a transaction normal/urgent based on current network conditions (use external service)
