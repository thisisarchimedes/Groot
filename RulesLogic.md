# PSP

1. **Slippage Guard**: We should always be able to leave the pool with minimal slippage.
    - **Logic**: Calculate slippage on an AMM pool (Convex/Aura or directly Curve/Balancer). How much slippage we suffer if we withdraw everything we currently have in the pool. 
    - **Parameters** Rule object get PSP strategy object, AMM pool address and slippage threshold as param. 
    - **If TRUE**: If we go above the slippage threshold we withdraw everything from the pool.

2. **Ownership Guard**: We don't want to own too much of the pool "vaule" asset
    - **Logic**: We only consider the "value" asset for this calculation (e.g.: ETH/OETH pool - we only count ETH). If we deposit more than a certain percentage of the pool's "value" asset, we withdraw the excess. Example: ETH/OETH pool. ETH=50 OETH=90, if our ownership threshold is 30%, we always deposit less than 15 ETH. In doesn't matter how much OETH in the pool for this calculation
     - **Parameters** _Ownership Threshold_ (30% in the above example). _Rebalance Rate_ (when we withdraw what is ownership target - for example when we trigger withdraw because we own more than 30% we want to withdraw until we own 20% of the pool value asset).
    - **If TRUE**: If we go above the _Ownership Threshold_ we withdraw until we are at the _Rebalance Rate_

3. **Deposit**: When a user deposit to our PSP strategy, tokens are not going straight to the pool. We deposit everything every period of time (say once a day)
     - **Logic**: If Slippage Guard and Ownership Guard aren't triggered, and:
        - We have more than a certain amount of tokens idle in the strategy
        - The amount of time passed from previous deposit (a.k.a. adjustin) and withdraw (a.k.a. adjust out), is more than our threshold
     - **Parameters**: Min amount to deposit, min period of time
    - **If TRUE**: Deposit all the idle liquidity to the AMM pool
    
3. **Recompound**


# Leverage

√