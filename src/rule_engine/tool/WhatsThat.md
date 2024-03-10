We want to keep good decoupling so rules don't directly work with ETH Node. 
Instead we create "tools", abstraction layer that represent our contracts and AMM pools
For example - tools can be
- Curve Pool: returns balance of a token, slippage as a function of LP tokens we withdraw etc..
- Leverage Position: returns expiration, debt, collateral etc..
- Price feeds: like on-chain oracles