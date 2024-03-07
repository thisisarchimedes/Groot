# PSP

## URGENT
1. **Slippage Guard**: We should always be able to leave the pool with minimal slippage.
    - **Logic**: Calculate slippage on an AMM pool (Convex/Aura or directly Curve/Balancer). How much slippage we suffer if we withdraw everything we currently have in the pool. 
    - **Parameters** Rule object get PSP strategy object, AMM pool address and slippage threshold as param. 
    - **If TRUE**: If we go above the slippage threshold we withdraw everything from the pool.

2. **Ownership Guard**: We don't want to own too much of the pool "vaule" asset
    - **Logic**: We only consider the "value" asset for this calculation (e.g.: ETH/OETH pool - we only count ETH). If we deposit more than a certain percentage of the pool's "value" asset, we withdraw the excess. Example: ETH/OETH pool. ETH=50 OETH=90, if our ownership threshold is 30%, we always deposit less than 15 ETH. In doesn't matter how much OETH in the pool for this calculation
     - **Parameters** _Ownership Threshold_ (30% in the above example). _Rebalance Rate_ (when we withdraw what is ownership target - for example when we trigger withdraw because we own more than 30% we want to withdraw until we own 20% of the pool value asset).
    - **If TRUE**: If we go above the _Ownership Threshold_ we withdraw until we are at the _Rebalance Rate_

## NORMAL
3. **Deposit**: When a user deposit to our PSP strategy, tokens are not going straight to the pool. We deposit everything every period of time (say once a day)
     - **Logic**: If Slippage Guard and Ownership Guard aren't triggered, and:
        - We have more than a certain amount of tokens idle in the strategy
        - The amount of time passed from previous deposit (a.k.a. adjustin) and withdraw (a.k.a. adjust out), is more than our threshold
     - **Parameters**: Min amount to deposit, min period of time
    - **If TRUE**: Deposit all the idle liquidity to the AMM pool

4. **Recompound**:  We collect APY, send protocol fees to the treasury, and compound the rest.
    - **Logic**: When a minimum amount of time passed, and the amount of fees the protocol gets is X times more than the estimated gas we pay for the entire process.
     - **Parameters** Min amount of time since last recompound, Expected protocol profit are are least X times more than expected gas fees.
    - **If TRUE**: Call "DoHardWork" on the strategy



# Leverage

# URGENT
1. **Liquidation**: When position is too close the the collateral value, we close it
    - **Logic**: Simulate closing the postion. If the amount of WBTC we get back is below: _collateral amount_ * _liquidation buffer_
    - **Parameters** : liquidation buffer (e.g. x1.1)
    - **If TRUE**: Liquidate position on chain

# NORMAL
2. **Rebalance pool/expiration**: When WBTC/lvBTC pool has less than a certain % of WBTC, we rebalance it
    - **Logic**: If the amount of WBTC in the pool is less than _pool rebalance threshold_ 
    - **Parameters**: 
        - _pool rebalance threshold_: the % of WBTC in the pool (e.g. 10%). 
        - _pool rebalance target_: the % of WBTC in the pool we aim from when rebalancing and expiring(e.g. 20%)
    - **If TRUE**: we deposit more WBTC to the pool from the WBTC vault. If there isn't enough WBTC in the vault, expire as much positions as needed (start from the oldest position)

3. **Add WBTC from pool to vault**: When WBTC/lvBTC pool has more than a certain % of WBTC, we mint lvBTC and swap it for WBTC, and add it to the vault
    - **Logic**: If the amount of WBTC in the pool is more than _vault rebalance target_ 
    - **Parameters**: 
        - _vault rebalance threshold_: the % of WBTC in the pool (e.g. 70%). 
        - _vault rebalance target_: the % of WBTC in the pool we aim from when rebalancing and expiring(e.g. 40%)
    - **If TRUE**: we mint lvBTC and use it to withdraw WBTC from the pool to the WBTC vault