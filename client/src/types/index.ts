export type AuctionDetail = {
  id: string;
  address: string;
  startTime: number;
  endTime: number;
  currentPrice: number;
  totalSupply: number;
  remainingSupply: number;
  hasEnded: boolean;
};

export type TokenDetail = {
  url: string;
  name: string;
  symbol: string;
  circulatingSupply: number;
  cappedSupply: number;
  address: string;
  tokenBurnt: number;
};

export type AuctionStartedLog = {
  tokenAddr: string;
  startTime: string;
  auctionAddr: string;
};

export type BidLog = {
  bidder: string;
  price: string;
  qty: string;
};

export type AuctionCreateInputs = {
  supply: string;
  startPrice: number;
  reservedPrice: number;
};

export type CreateTokenInputs = {
  tokenName: string;
  tokenSymbol: string;
  tokenSupply: number;
};
