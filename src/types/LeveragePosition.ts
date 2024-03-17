/* eslint-disable semi */
export default interface LeveragePosition {
    id: number;
    nftId: number;
    user: string;
    debtAmount: number;
    timestamp: Date;
    currentPositionValue: number;
    strategyShares: number;
    strategy: string;
    blockNumber: number;
    positionExpireBlock: number;
    positionState: string;
    collateralAmount: number;
    claimableAmount: number;
}
