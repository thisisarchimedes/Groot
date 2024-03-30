import {Address} from '../../../../types/LeverageContractAddresses';

export interface IUniSwapPayloadBuilder {
    getOpenPositionSwapPayload(
        amount: bigint,
        strategy: Address,
        currentTimestamp: number,
    ): Promise<string>;

    getClosePositionSwapPayload(
        strategy: Address,
        strategyShares: number,
        currentTimestamp: number,
    ): Promise<string>;
}
