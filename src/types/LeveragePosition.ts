/* eslint-disable semi */
export default interface LeveragePosition {
    nftId: number;
    debtAmount: number;
    strategyShares: number;
    strategy: string;
    blockNumber: number;
    positionExpireBlock: number;
    positionState: PositionState;
    collateralAmount: number;
    claimableAmount: number;
}

export enum PositionState {
    UNINITIALIZED,
    LIVE,
    EXPIRED,
    LIQUIDATED,
    CLOSED
}
