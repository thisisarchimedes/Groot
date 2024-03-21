import { CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core';
import { Protocol } from '@uniswap/router-sdk';
import { AlphaRouter, SwapRoute } from '@uniswap/smart-order-router';
import { Pool } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import EthereumAddress from '../../../types/EthereumAddress';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let uniSwapEthers: any;

if (process.env.AWS_EXECUTION_ENV) {
    // Running on AWS Lambda
    uniSwapEthers = require('/opt/nodejs/node_modules/ethers');
} else {
    // Running locally
    uniSwapEthers = require('@uniswap/smart-order-router/node_modules/ethers');
}

export default class Uniswap {
    private router: AlphaRouter;

    constructor(MAINNET_RPC_URI: string) {
        this.router = new AlphaRouter({
            chainId: 1,
            provider: new uniSwapEthers.providers.JsonRpcProvider(MAINNET_RPC_URI),
        });
    }

    public async buildPayload(
        amount: string,
        inputToken: EthereumAddress,
        inputTokenDecimals: number,
        outputToken: EthereumAddress,
        outputTokenDecimals: number,
    ): Promise<{ payload: string; swapOutputAmount: string }> {
        try {
            const primaryAsset = new Token(1, inputToken.toString(), inputTokenDecimals);
            const secondaryAsset = new Token(1, outputToken.toString(), outputTokenDecimals);
            const protocols = ['V3'] as Protocol[];
            if (!primaryAsset || !secondaryAsset) throw new Error('Please enter a valid asset');
            const amountBN = ethers.parseUnits(amount, inputTokenDecimals).toString();
            const route: SwapRoute | null = await this.router.route(
                CurrencyAmount.fromRawAmount(primaryAsset, amountBN),
                secondaryAsset,
                TradeType.EXACT_INPUT,
                undefined,
                { protocols },
            );
            const { pools, tokenPath, swapOutputAmount } = this.mapRouteData(route);
            const { dataTypes, dataValues } = this.buildPathFromUniswapRouteData(
                pools,
                tokenPath,
            );
            const abiCoder = ethers.AbiCoder.defaultAbiCoder();
            const timestamp = Math.floor(Date.now() / 1000);
            const encodedPath = ethers.solidityPacked(dataTypes, dataValues);
            const deadline = BigInt(timestamp + 100000000);
            const amountOutMin = 1;
            const payload = abiCoder.encode(
                ['(bytes,uint256,uint256)'],
                [[encodedPath, deadline, amountOutMin]],
            );
            return { swapOutputAmount, payload };
        } catch (err) {
            console.error('fetchUniswapRoute err: ', err);
            throw err;
        }
    }

    private mapRouteData = (route: SwapRoute | null) => {
        if (!route) throw new Error('Please enter a valid route');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        const pools = route.route[0].route.pools;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        const tokenPath = route.route[0].route.tokenPath;
        const swapOutputAmount = route.quote.toExact() || '0';
        return { pools, tokenPath, swapOutputAmount };
    };

    private buildPathFromUniswapRouteData(pools: Pool[], tokens: Token[]) {
        const dataTypes = [];
        const dataValues = tokens.map((t) => t.address);
        let feeIndex = 1;
        for (let i = 0; i < pools.length; i++) {
            const currentPool: Pool = pools[i];
            if (i === 0) {
                dataTypes.push('address', 'uint24', 'address');
            } else {
                dataTypes.push('uint24', 'address');
            }
            dataValues.splice(feeIndex, 0, currentPool.fee.toString());
            feeIndex += 2;
        }
        return { dataTypes, dataValues };
    }
}
