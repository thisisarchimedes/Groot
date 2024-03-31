export type Address = string;

export interface LeverageContractAddresses {
    positionOpener: Address;
    positionLiquidator: Address;
    positionCloser: Address;
    positionExpirator: Address;
    positionLedger: Address;
}
