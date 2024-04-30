import {Rule} from './Rule';
import PositionLedgerContract from '../tool/contracts/PositionLedgerContract';
import fs from 'fs';
import {Address} from '../../types/LeverageContractAddresses';
import {OutboundTransaction, RawTransactionData} from '../../blockchain/OutboundTransaction';
import {RuleConstructorInput, RuleParams} from '../TypesRule';


export class RuleExpirePositions extends Rule {
  private positionLedgerContract!: PositionLedgerContract;
  private positionLedgerAddress!: Address;
  private positionLedgerABI!: string;

  // private uniswap: Uniswap;
  // private positionLedger: PositionLedger;

  constructor(input: RuleConstructorInput) {
    if (!input.leverageDataSource) {
      throw new Error('LeverageDataSource is required for ExpirePositions rule');
    }

    super(input);
    // this.uniswap = new Uniswap('');

    this.positionLedgerAddress = this.configService.getLeverageContractInfo().positionLedger;
    try {
      // this.positionLedgerABI = await this.abiRepo.getAbiByAddress(positionLedgerAddress);
      throw new Error('failed to fetch');
    } catch {
      this.positionLedgerABI = fs.readFileSync('./src/constants/abis/POSITION_LEDGER_ABI.json', 'utf-8');
    }
    this.positionLedgerContract = new PositionLedgerContract(this.positionLedgerAddress, this.positionLedgerABI);
  }

  public async evaluate(): Promise<void> {
    await Promise.resolve();
    const encodedData =
      this.positionLedgerContract.contract.interface.encodeFunctionData(
          'setPositionState',
          [0, 1],
      );

    const tx = {
      to: this.positionLedgerAddress,
      value: 0n,
      data: encodedData,
    } as RawTransactionData;

    const outboundTx = {
      urgencyLevel: this.params.urgencyLevel,
      executor: this.params.executor,
      context: `RuleExpirePositions`,
      postEvalUniqueKey: this.generateUniqueKey(),
      lowLevelUnsignedTransaction: tx,
      ttlSeconds: this.params.ttlSeconds,
    } as OutboundTransaction;

    this.pushTransactionToRuleLocalQueue(outboundTx);
  }

  public async initialize(
      ruleLabel: string,
      params: RuleParams,
  ): Promise<void> {
    this.ruleLabel = ruleLabel;
    this.params = params;

    this.positionLedgerAddress =
      this.configService.getLeverageContractInfo().positionLedger;
    try {
      // this.positionLedgerABI = await this.abiRepo.getAbiByAddress(positionLedgerAddress);
      throw new Error('failed to fetch');
    } catch {
      this.positionLedgerABI = fs.readFileSync(
          './src/constants/abis/POSITION_LEDGER_ABI.json',
          'utf-8',
      );
    }
    this.positionLedgerContract = new PositionLedgerContract(
        this.positionLedgerAddress,
        this.positionLedgerABI,
    );
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
  //     context: `RuleExpirePositions`,
  //     postEvalUniqueKey: this.generateUniqueKey(),
  //     lowLevelUnsignedTransaction: { to: '', value: BigInt(0), data: '' } as RawTransactionData,
  //   };
  // }

  protected generateUniqueKey(): string {
    return 'expire--';
  }
}
