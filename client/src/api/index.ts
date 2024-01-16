import ERC20Token from "../contracts/ERC20Token.json";
import DutchAuction from "../contracts/DutchAuction.json";

import { TokenDetail, AuctionDetail, AuctionStartedLog } from "../types";
import { WeiToEth } from "../utils/utils";
import { AuctionFactoryEvents, TokenFactoryEvents } from "../constants/contract";

export class TokerApi {
  web3: any;
  tfContract: any;
  account: string;

  constructor(web3: any, tfContract: any, account: string) {
    this.web3 = web3;
    this.account = account;
    this.tfContract = tfContract;
  }

  async fetchTokenDetail(tokenAddr: string): Promise<TokenDetail> {
    const contract = new this.web3.eth.Contract((ERC20Token as any).abi, tokenAddr);
    const tokenDetail = await contract.methods.getDetails().call();
    return {
      url: tokenDetail["url"],
      name: tokenDetail["name"],
      symbol: tokenDetail["symbol"],
      address: tokenAddr,
      tokenBurnt: parseInt(tokenDetail["tokenBurnt"]),
      cappedSupply: parseInt(tokenDetail["cappedSupply"]),
      circulatingSupply: parseInt(tokenDetail["cirSupply"]),
    };
  }

  async fetchAuctionDetail(auctionAddr: string): Promise<AuctionDetail> {
    const contract = new this.web3.eth.Contract((DutchAuction as any).abi, auctionAddr);
    const auctionDetail = await contract.methods.getDetails().call();
    return {
      id: auctionDetail["id"],
      address: auctionAddr,
      hasEnded: auctionDetail["hasEnded"],
      startTime: parseInt(auctionDetail["startTime"]),
      endTime: parseInt(auctionDetail["endTime"]),
      currentPrice: WeiToEth(auctionDetail["currentPrice"]),
      totalSupply: parseInt(auctionDetail["totalSupply"]),
      remainingSupply: parseInt(auctionDetail["remainingSupply"]),
    };
  }

  async fetchAllTokenAddresses(): Promise<string[]> {
    return await this.tfContract.methods.getAllTokenAddresses().call();
  }

  async fetchTokenAddress(tokenSymbol: string): Promise<string> {
    const address = await this.tfContract.methods.getTokenAddress(tokenSymbol).call();
    return address;
  }

  async fetchAuctionAddrById(auctionId: string): Promise<string> {
    const auctionAddr = await this.tfContract.methods.getAuctionAddress(auctionId).call();
    return auctionAddr;
  }

  async fetchTokenAddrByAuctionAddr(auctionAddr: string): Promise<string> {
    const contract = new this.web3.eth.Contract((DutchAuction as any).abi, auctionAddr);
    const tokenAddr = await contract.methods.getTokenAddr().call();
    return tokenAddr;
  }

  async fetchOwnedTokens(): Promise<TokenDetail[]> {
    const logs = await this.tfContract.getPastEvents(TokenFactoryEvents.TokenCreated, {
      fromBlock: 0,
      toBlock: "latest",
      filter: { owner: this.account },
    });
    const ownedTokenAddrs: string[] = logs.map((log: any) => log.returnValues["tokenAddress"]);
    const tokens = await Promise.all(
      ownedTokenAddrs.map(async (tokenAddr) => {
        const detail = await this.fetchTokenDetail(tokenAddr);
        return detail;
      })
    );
    return tokens;
  }
  async fetchTokenAuctionStartedLogs(tokenAddr: string): Promise<AuctionStartedLog[]> {
    const logs = await this.tfContract.getPastEvents(AuctionFactoryEvents.AuctionStarted, {
      fromBlock: 0,
      toBlock: "latest",
      filter: { tokenAddr: tokenAddr },
    });
    return logs.map((log: any) => ({ ...log["returnValues"] }));
  }

  async fetchTokenBalance(tokenAddr: string): Promise<string> {
    const contract = new this.web3.eth.Contract((ERC20Token as any).abi, tokenAddr);
    return await contract.methods.balanceOf(this.account).call();
  }

  async getEthBalance(): Promise<string> {
    const balanceInWei = await this.web3.eth.getBalance(this.account);
    const balanceInEth = this.web3.utils.fromWei(balanceInWei, "ether").slice(0, 10);
    return balanceInEth;
  }

  async createAuction(
    tokenAddr: string,
    supply: string,
    startPriceWei: string,
    reservedPriceWei: string
  ): Promise<void> {
    await this.tfContract.methods
      .newAuction(tokenAddr, supply, startPriceWei, reservedPriceWei)
      .send({ from: this.account });
  }

  async createToken(name: string, symbol: string, supply: number, url: string): Promise<void> {
    await this.tfContract.methods
      .createERC20Token(name.toLowerCase().trim(), symbol.toLowerCase().trim(), supply, url)
      .send({ from: this.account });
  }

  subscribeAuctionBlock(callBack: () => void) {
    return this.web3.eth
      .subscribe("newBlockHeaders", function (err: any, result: any) {
        if (!err) {
          callBack();
        }
      })
      .on("connected", function (subscriptionId: any) {
        console.log("Subscribe to block event", subscriptionId);
      })
      .on("error", console.error);
  }

  subscribeAuctionStarted(callBack: () => void) {
    return this.tfContract.events.AuctionStarted({ fromBlock: 0 }, function (error: any, event: any) {
      callBack();
    });
  }

  subscribeTokenCreated(callBack: (blockEvent: any) => void) {
    return this.tfContract.events.TokenCreated({ fromBlock: 0 }, function (error: any, event: any) {
      callBack(event);
    });
  }
}
