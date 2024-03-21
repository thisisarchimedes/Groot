import EthereumAddress from "./EthereumAddress";

export type ClosePositionParamsStruct = {
    nftId: number;
    minWBTC: bigint;
    swapRoute: bigint;
    swapData: string;
    exchange: EthereumAddress;
};