import { Rule, RuleParams } from './Rule';
import { UrgencyLevel } from '../TypesRule';
import { OutboundTransaction } from '../../blockchain/OutboundTransaction';
import LeverageDataSource from '../tool/data_source/LeverageDataSource';
import { RuleConstructorInput } from '../../types/RuleConstructorInput';
import LeveragePosition from '../../types/LeveragePosition';
import { Contract, Transaction } from 'web3';
import POSITION_EXPIRATOR_ABI from '../../constants/abis/POSITION_EXPIRATOR_ABI.json';
import EthereumAddress from '../../types/EthereumAddress';
import ethers from 'ethers';
import Uniswap from '../tool/uniswap/Uniswap';
import PositionLedger from '../tool/contracts/PositionLedger';

export interface RuleParamsDummy extends RuleParams {
  message: string;
  NumberOfDummyTxs: number;
  evalSuccess: boolean;
}


const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const WBTC_DECIMALS = 8;

export class RuleExpirePositions extends Rule {
  private leverageDataSource: LeverageDataSource;
  private expirationContract: Contract<any>;
  private uniswap: Uniswap;
  private positionLedger: PositionLedger;




  constructor(constractorInput: RuleConstructorInput) {
    super(constractorInput);
    this.leverageDataSource = new LeverageDataSource();
    this.expirationContract = new Contract(POSITION_EXPIRATOR_ABI, '');
    this.uniswap = new Uniswap('');
    this.positionLedger = new PositionLedger(null, new EthereumAddress(''));
  }

  public async evaluate(): Promise<void> {
    const blockNumber = await this.blockchainReader.getBlockNumber();
    const livePositions = await this.leverageDataSource.getLivePositions();

    for (const position of livePositions) {
      if (position.positionExpireBlock > blockNumber) {
        const tx = this.createExpireTransaction(position);
        this.pushTransactionToRuleLocalQueue(tx);
      }
    }

    // if (params.evalSuccess === false) {
    //   throw new Error('RuleExpirePositions.evaluate() failed');
    // }
  }

  /**
 * Preview the expiration of a position
 * @param position - The position to preview
 * @returns The minimum WBTC and payload
 */
  public async previewExpirePosition(position: LeveragePosition): Promise<{
    minimumWBTC: bigint;
    payload: string;
  }> {
    const strategyInstance = this.multiPoolStrategyFactory.create(new EthereumAddress(position.strategy));

    // get blockchain position
    const blockchainPosition = await this.positionLedger.getPosition(position.nftId);

    const minimumExpectedAssets = await strategyInstance.convertToAssets(blockchainPosition.strategyShares);

    const strategyAsset = await strategyInstance.asset();
    const assetDecimals = await strategyInstance.decimals();

    const { payload, swapOutputAmount } = await this.uniswap.buildPayload(
      ethers.formatUnits(minimumExpectedAssets, assetDecimals),
      new EthereumAddress(strategyAsset),
      Number(assetDecimals),
      new EthereumAddress(WBTC_ADDRESS),
      WBTC_DECIMALS,
    );

    return {
      minimumWBTC: BigInt(ethers.parseUnits(swapOutputAmount, WBTC_DECIMALS)),
      payload,
    };
  }

  private createExpireTransaction(position: LeveragePosition): OutboundTransaction {


    //call uniswap and generate ClosePositionParamsStruct
    this.uniswap.buildPayload(0)

    //generate tx
    const tx = this.expirationContract.methods.expirePosition(position.nftId, null) as Transaction;

    return {
      urgencyLevel: UrgencyLevel.NORMAL,
      context: `Position expired transaction`,
      postEvalUniqueKey: this.generateUniqueKey(position),
      lowLevelUnsignedTransaction: tx,
    };
  }

  protected generateUniqueKey(position: LeveragePosition): string {
    return `${position.nftId}-${position.strategy}`;
  }
}
