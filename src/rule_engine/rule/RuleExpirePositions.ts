import {Rule, RuleParams} from './Rule';
import {ILeverageDataSource} from '../tool/data_source/interfaces/ILeverageDataSource';
import {inject, injectable} from 'inversify';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../tool/abi_repository/interfaces/IAbiRepo';
import PositionLedgerContract from '../tool/contracts/PositionLedgerContract';
import {IConfigService} from '../../service/config/interfaces/IConfigService';
import fs from 'fs';
import {Address} from '../../types/LeverageContractAddresses';
import {OutboundTransaction, RawTransactionData} from '../../blockchain/OutboundTransaction';
import {UrgencyLevel} from '../TypesRule';

export interface RuleParamsDummy extends RuleParams {
  message: string;
  NumberOfDummyTxs: number;
  evalSuccess: boolean;
}

// const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
// const WBTC_DECIMALS = 8;

@injectable()
export class RuleExpirePositions extends Rule {
  private leverageDataSource: ILeverageDataSource;
  private configService: IConfigService;
  private positionLedgerContract!: PositionLedgerContract;
  private positionLedgerAddress!: Address;
  private positionLedgerABI!: string;
  // private uniswap: Uniswap;
  // private positionLedger: PositionLedger;

  constructor(
    @inject('ILoggerAll') logger: ILogger,
    @inject('IBlockchainReader') blockchainReader: IBlockchainReader,
    @inject('IAbiRepo') abiRepo: IAbiRepo,
    @inject('ILeverageDataSource') leverageDataSource: ILeverageDataSource,
    @inject('IConfigServiceAWS') configService: IConfigService,
  ) {
    super(logger, blockchainReader, abiRepo);
    this.leverageDataSource = leverageDataSource;
    this.configService = configService;
    // this.uniswap = new Uniswap('');
  }

  public async evaluate(): Promise<void> {
    await Promise.resolve();

    const encodedData = this.positionLedgerContract
        .contract.interface.encodeFunctionData('setPositionState', [0, 1]);

    const tx = {
      to: this.positionLedgerAddress,
      value: 0n,
      data: encodedData,
    } as RawTransactionData;

    const outboundTx = {
      urgencyLevel: UrgencyLevel.LOW,
      context: `this is a expire test context`,
      postEvalUniqueKey: this.generateUniqueKey(0),
      lowLevelUnsignedTransaction: tx,
    } as OutboundTransaction;

    this.pushTransactionToRuleLocalQueue(outboundTx);
  }

  public override async initialize(ruleLabel: string, params: RuleParams | unknown): Promise<void> {
    this.ruleLabel = ruleLabel;
    this.params = params;


    this.positionLedgerAddress = this.configService.getLeverageContractInfo().positionLedger;
    try {
      // this.positionLedgerABI = await this.abiRepo.getAbiByAddress(positionLedgerAddress);
      throw new Error('failed to fetch');
    } catch {
      this.positionLedgerABI = fs.readFileSync('./src/constants/abis/POSITION_LEDGER_ABI.json', 'utf-8');
    }
    this.positionLedgerContract = new PositionLedgerContract(this.positionLedgerAddress, this.positionLedgerABI);
    await Promise.resolve();
  }

  /**
 * Preview the expiration of a position
 * @param position - The position to preview
 * @returns The minimum WBTC and payload
 */
  // public async previewExpirePosition(position: LeveragePosition): Promise<{
  //   minimumWBTC: bigint;
  //   payload: string;
  // }> {
  //   const strategyInstance = new MultiPoolStrategy(new EthereumAddress(position.strategy));
  //   const positionLedger = new PositionLedger(new EthereumAddress(position.strategy))

  //   // get blockchain position
  //   const blockchainPosition = await positionLedger.getPosition(position.nftId);

  //   const minimumExpectedAssets = await strategyInstance.convertToAssets(blockchainPosition.strategyShares);

  //   const strategyAsset = await strategyInstance.asset();
  //   const assetDecimals = await strategyInstance.decimals();

  //   const { payload, swapOutputAmount } = await this.uniswap.buildPayload(
  //     ethers.formatUnits(minimumExpectedAssets, assetDecimals),
  //     new EthereumAddress(strategyAsset),
  //     Number(assetDecimals),
  //     new EthereumAddress(WBTC_ADDRESS),
  //     WBTC_DECIMALS,
  //   );

  //   return {
  //     minimumWBTC: BigInt(ethers.parseUnits(swapOutputAmount, WBTC_DECIMALS)),
  //     payload,
  //   };
  // }

  // private createExpireTransaction(position: LeveragePosition): OutboundTransaction {
  //   // //call uniswap and generate ClosePositionParamsStruct
  //   // this.uniswap.buildPayload(0)

  //   // //generate tx
  //   // const tx = this.expirationContract.methods.expirePosition(position.nftId, null) as Transaction;

  //   return {
  //     urgencyLevel: UrgencyLevel.NORMAL,
  //     context: `Position expired transaction`,
  //     postEvalUniqueKey: this.generateUniqueKey(),
  //     lowLevelUnsignedTransaction: { to: '', value: BigInt(0), data: '' } as RawTransactionData,
  //   };
  // }

  protected generateUniqueKey(nftId?: number): string {
    return 'expire--' + nftId;
  }
}
