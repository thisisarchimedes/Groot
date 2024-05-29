import { expect } from "chai";
import { JsonRpcProvider, Contract } from "ethers";

import * as dotenv from "dotenv";
import { ToolBalancerPSP } from "../../src/rule_engine/tool/ToolBalancerPSP";
import { BlockchainReader } from "../../src/blockchain/blockchain_reader/BlockchainReader";
import { BlockchainNodeRemoteRPC } from "../../src/blockchain/blockchain_nodes/BlockchainNodeRemoteRPC";
import { LoggerConsole } from "../../src/service/logger/LoggerConsole";
dotenv.config();

describe("Balancer Stratgy interface", function () {
  // eslint-disable-next-line no-invalid-this
  this.timeout(12000);

  let alchemyRpc: JsonRpcProvider;
  const balancerStrategyAddress = "0x2C7E5F0C63e74F7e962eb9a6feE1fFe03e6bD531";
  const balancerAdapterAddress = "0xacf3335bD7CCdE10EE4BBfB50129562E7789af9D";

  let blockchainReader: BlockchainReader;
  let toolBalancerPSP: ToolBalancerPSP;

  beforeEach(function () {
    const apiKeyAlchemy = process.env.API_KEY_ALCHEMY;

    alchemyRpc = new JsonRpcProvider(
      `https://eth-mainnet.alchemyapi.io/v2/${apiKeyAlchemy}`
    );

    // LoggerConsole
    // BlockchainNodeRemoteRPC
    const mainNode = new BlockchainNodeRemoteRPC(
      new LoggerConsole(),
      `https://eth-mainnet.alchemyapi.io/v2/${apiKeyAlchemy}`,
      "alchemyNode"
    );
    const altNode = new BlockchainNodeRemoteRPC(
      new LoggerConsole(),
      `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      "infuraNode"
    );

    blockchainReader = new BlockchainReader({
      mainNode: mainNode,
      altNode: altNode,
    });
    toolBalancerPSP = new ToolBalancerPSP(
      balancerStrategyAddress,
      balancerAdapterAddress,
      blockchainReader
    );
  });

  it("should fetch the last adjustIn timestamp", async function () {
    const lastAdjustIn = await toolBalancerPSP.lastAdjustInTimestamp();
    expect(lastAdjustIn).to.be.a("bigint");
  });

  it("should fetch the last adjustOut timestamp", async function () {
    const lastAdjustOut = await toolBalancerPSP.lastAdjustOutTimestamp();
    expect(lastAdjustOut).to.be.a("bigint");
  });

  it("should fetch the pool id for adapter", async function () {
    const poolId = await toolBalancerPSP.getPoolId();
    expect(poolId).to.be.a("string");
  });

  it("should fetch the pool tokens", async function () {
    const poolTokens = await toolBalancerPSP.fetchPoolTokens();
    expect(poolTokens.balances).to.be.an("array");
    expect(poolTokens.tokens).to.be.an("array");
    expect(poolTokens.lastChangeBlock).to.be.a("bigint");
  });

  it("should fetch the underlying balance", async function () {
    const underlyingBalance =
      await toolBalancerPSP.fetchAdapterUnderlyingBalance();
    expect(underlyingBalance).to.be.a("bigint");
  });

  it("should fetch the lp balance", async function () {
    const lpBalance = await toolBalancerPSP.fetchAdapterLpBalance();
    expect(lpBalance).to.be.a("bigint");
  });
});
