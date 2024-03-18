export type ClosePositionParamsStruct = {
    nftId: number;
    minWBTC: bigint;
    swapRoute: BigNumberish;
    swapData: BytesLike;
    exchange: AddressLike;
};