import LeveragePosition from '../../../../types/LeveragePosition';

export interface ILeverageDataSource {
    getPositionsByNftIds(nftIds: number[]): Promise<LeveragePosition[]>;
    getLivePositions(): Promise<LeveragePosition[]>;
    getLivePositionsNftIds(): Promise<number[]>;
}
