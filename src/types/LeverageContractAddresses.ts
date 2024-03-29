import {EthereumAddress} from '@thisisarchimedes/backend-sdk';

export interface LeverageContractAddresses {
  positionOpener: EthereumAddress;
  positionLiquidator: EthereumAddress;
  positionCloser: EthereumAddress;
  positionExpirator: EthereumAddress;
}
