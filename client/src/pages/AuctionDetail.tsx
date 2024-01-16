import React, { Fragment, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { EthToWei, WeiToEth, extractRpcError } from "../utils/utils";
import { toast } from "react-toastify";
import { CountdownTimer } from "../components/CountdownTimer";
import { AuctionDetail, BidLog, TokenDetail } from "../types";
import DutchAuction from "../contracts/DutchAuction.json";
import { PageNotFound } from "./PageNotFound";
import { Spinner } from "../components/Spinner";
import { AuctionStatus } from "../components/AuctionStatus";
import { Paths } from "../constants/paths";
import { PageLoading } from "./PageLoading";

const AuctionPage = () => {
  const { auctionId } = useParams();
  const { tokerApi, web3 } = useData();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<TokenDetail>();
  const [auction, setAuction] = useState<AuctionDetail>();

  // Listens to new mined blocks, then update AuctionDetail
  useEffect(() => {
    const fetchAuctionDetail = () => {
      if (!auction?.address) return;
      tokerApi
        .fetchAuctionDetail(auction.address)
        .then((auctionDetail) => {
          setAuction(auctionDetail);
        })
        .catch(console.log);
    };

    const blockSubcription = tokerApi.subscribeAuctionBlock(fetchAuctionDetail);

    return () => blockSubcription.unsubscribe();
  }, [web3, tokerApi, auction?.address]);

  useEffect(() => {
    const initAuctionDetail = async () => {
      try {
        if (!auctionId) return;
        setLoading(true);
        const auctionAddr = await tokerApi.fetchAuctionAddrById(auctionId);
        const auctionDetail = await tokerApi.fetchAuctionDetail(auctionAddr);
        const tokenAddr = await tokerApi.fetchTokenAddrByAuctionAddr(auctionAddr);
        const tokenDetail = await tokerApi.fetchTokenDetail(tokenAddr);
        setToken(tokenDetail);
        setAuction(auctionDetail);
      } catch (err: any) {
        toast.error(extractRpcError(err));
      } finally {
        setLoading(false);
      }
    };
    initAuctionDetail();
    return () => {};
  }, [tokerApi, auctionId]);

  return loading ? (
    <PageLoading />
  ) : !(auction && token) ? (
    <PageNotFound />
  ) : (
    <AuctionLive token={token} auction={auction} />
  );
};

const AuctionLive: React.FC<{ auction: AuctionDetail; token: TokenDetail }> = ({ auction, token }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const tokenPoolLeft = ((auction.remainingSupply / auction.totalSupply) * 100).toFixed(2);

  return (
    <div className="justify-center max-w-xl mx-auto">
      <div className="px-6 py-4 bg-white border border-gray-200 rounded-lg shadow min-w-lg">
        <div className="font-bold text-center gap-2">
          <AuctionStatus startTime={auction.startTime} endTime={auction.endTime} hasEnded={auction.hasEnded} />
          <div className="items-center flex justify-center gap-2">
            <img src={token.url} alt="token_image" className="rounded-full h-5 w-5" />
            <p
              className="text-xl font-semibold text-center my-2 capitalize"
              onClick={() => navigate(`${Paths.TOKEN}${token.symbol}`)}
            >
              {token.name}
            </p>
          </div>
        </div>
        <div>
          <div className="font-semibold text-center my-2 border py-2 block rounded">
            <p className="text-lg">{auction.currentPrice.toFixed(6)}</p>
            <p className="text-xs">Current Price</p>
          </div>
          <div className="flex flex-grow justify-between font-semibold mt-4 text-gray-500">
            <div>
              <div className="flex items-center mr-2 gap-1">
                <span className="uppercase">{`${token.symbol} `}</span>
                Remaining
              </div>
              <span className="text-blue-500 flex items-center gap-2">
                {auction.remainingSupply}
                <span className="text-gray-600 text-sm">({tokenPoolLeft}%)</span>
              </span>
            </div>
            <div className="text-right">
              <p>Time Left</p>
              <p className="font-semibold">
                <CountdownTimer targetDate={auction.endTime} hasEnded={auction.hasEnded} />
              </p>
            </div>
          </div>
        </div>

        <ul className="hidden text-sm font-medium text-center text-gray-500 divide-x divide-gray-200 rounded-lg shadow sm:flex mt-4">
          <li className="w-full">
            <div
              onClick={() => setTab(0)}
              className={`cursor-pointer inline-block w-full p-4 rounded-l-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none ${
                tab === 0 ? "text-gray-900 bg-gray-100" : "bg-white hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Place Bids
            </div>
          </li>
          <li className="w-full">
            <div
              onClick={() => setTab(1)}
              className={`cursor-pointer inline-block w-full p-4 rounded-r-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none ${
                tab === 1 ? "text-gray-900 bg-gray-100" : "bg-white hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              My Bids
            </div>
          </li>
        </ul>
        {tab === 0 ? <PlaceBidTab auction={auction} /> : <BidHistory auctionAddr={auction.address} />}
      </div>
    </div>
  );
};

const PlaceBidTab = (props: { auction: AuctionDetail }) => {
  const { auction } = props;
  const { account, web3 } = useData();
  const [balance, setBalance] = useState("0");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidPercentage, setBidPercentage] = useState(0);
  const totalBidAmount = parseFloat(((bidPercentage * parseFloat(balance)) / 100).toFixed(4));
  const canPlacebid = totalBidAmount >= auction.currentPrice || "";

  const initBalance = useCallback(async () => {
    try {
      const balanceInWei = await web3.eth.getBalance(account);
      const balanceInEth = parseFloat(web3.utils.fromWei(balanceInWei, "ether")).toPrecision(4);
      setBalance(balanceInEth);
    } catch (err) {
      toast.error("unable to get account details");
    }
  }, [account, web3]);

  const placeBid = async () => {
    try {
      setBidLoading(true);
      const contract = new web3.eth.Contract((DutchAuction as any).abi, auction.address);
      await contract.methods.bid().send({ from: account, value: EthToWei(totalBidAmount) });
      await initBalance();
      setBidPercentage(0);
      toast.success(`Successfully bidded ${totalBidAmount} eth`);
    } catch (err: any) {
      toast.error(extractRpcError(err));
    } finally {
      setBidLoading(false);
    }
  };

  const endAuction = async () => {
    try {
      setBidLoading(true);
      const contract = new web3.eth.Contract((DutchAuction as any).abi, auction?.address);
      await contract.methods.endDutchAuction().send({ from: account });
    } catch (err: any) {
      toast.error(extractRpcError(err));
    } finally {
      setBidLoading(false);
    }
    return;
  };

  const handleBidSlider = (event: { target: HTMLInputElement }) => {
    setBidPercentage(parseInt(event.target.value));
  };

  // Fetch balance of user
  useEffect(() => {
    initBalance();
  }, [account, web3, initBalance]);

  return (
    <Fragment>
      <div className="block my-6 p-2 bg-white border border-gray-200 rounded-lg shadow">
        <div className="flex items-center justify-between font-semibold">
          <p className="mb-2 text-md tracking-tight text-gray-900">Bid Amount</p>
          <p className="text-gray-500 text-sm">
            {totalBidAmount.toPrecision(4)}/{balance} Eth
          </p>
        </div>

        <input
          id="steps-range"
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={bidPercentage}
          onChange={handleBidSlider}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />

        <div className="flex justify-between text-xs font-semibold mt-1">
          {["0%", "25%", "50%", "75%", "100%"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <div className="block my-6 p-2 bg-white border border-gray-200 rounded-lg shadow">
        <div className="font-semibold text-gray-500 grid grid-cols-4 divide-x py-2">
          <p className="col-span-1">Max Price</p>
          <p className="text-right col-span-3">{auction.currentPrice.toFixed(6)}</p>
        </div>
      </div>
      <div className="block mb-4 p-2 bg-blue-600 border text-white border-gray-200 rounded-lg shadow">
        <div className="font-bold flex justify-between py-4 text-sm px-2">
          <p>Minimum Potential Tokens</p>
          <p className="text-right">
            {Math.min(Math.floor(totalBidAmount / auction.currentPrice), auction.remainingSupply)}
          </p>
        </div>
      </div>
      {new Date().getTime() < new Date(auction.endTime * 1000).getTime() ? (
        <button
          type="button"
          onClick={placeBid}
          disabled={!canPlacebid || bidLoading || auction.hasEnded}
          className="text-white bg-blue-700 hover:bg-blue-800 cursor-pointer flex items-center gap-2 justify-center disabled:cursor-not-allowed w-full py-2.5 px-5 mr-2 mb-2 disabled:text-slate-500 disabled:bg-gray-200 text-sm font-medium focus:outline-none rounded-full border border-gray-200 focus:z-10 focus:ring-4 focus:ring-gray-200"
        >
          Place Bid {bidLoading && <Spinner />}
        </button>
      ) : (
        !auction.hasEnded && (
          <button
            type="button"
            onClick={endAuction}
            disabled={bidLoading}
            className="cursor-pointer disabled:cursor-not-allowed w-full py-2.5 px-5 mr-2 mb-2 disabled:text-slate-500 disabled:bg-gray-200 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-full border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 "
          >
            End Auction
          </button>
        )
      )}
    </Fragment>
  );
};

const BidHistory = (props: { auctionAddr: string }) => {
  const { web3, account } = useData();
  const { auctionAddr } = props;
  const [bidLogs, setBidLogs] = useState<BidLog[]>([]);

  useEffect(() => {
    const fetchAuctionLogs = async () => {
      const contract = new web3.eth.Contract((DutchAuction as any).abi, auctionAddr);
      const logs = await contract.getPastEvents("BidSubmitted", {
        fromBlock: 0,
        toBlock: "latest",
        filter: { bidder: account },
      });
      console.log("## LOGS", logs);
      const logDetails: BidLog[] = logs.map((log: any) => ({ ...log["returnValues"] }));
      setBidLogs(logDetails);
    };
    fetchAuctionLogs();
  }, [auctionAddr, web3, account]);

  return (
    <div className="mt-6">
      <div className="border-t border-gray-100 font-semibold mt-4">
        <dl className="divide-y divide-gray-100">
          {bidLogs.length === 0 ? (
            <div className="text-center my-4">
              <p> No bids yet</p>
            </div>
          ) : (
            <div>
              {bidLogs.map((bidLog) => (
                <div key={bidLog.price} className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {WeiToEth(parseFloat(bidLog.price))} Eth
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-green-700 sm:col-span-2 sm:mt-0 text-right">Accepted</dd>
                </div>
              ))}
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};
export default AuctionPage;
