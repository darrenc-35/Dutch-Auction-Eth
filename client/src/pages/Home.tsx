import { useEffect, useState, Fragment, useCallback } from "react";
import { TokenItem } from "../components/TokenItem";
import { AuctionItem } from "../components/AuctionItem";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router-dom";
import { AuctionFactoryEvents } from "../constants/contract";
import { AuctionStartedLog } from "../types";
import { RECENT_BLOCK_INTERVAL } from "../constants";
import { Paths } from "../constants/paths";

const Home = () => {
  return (
    <Fragment>
      <RecentAuctions />
      <TokenListing />
    </Fragment>
  );
};

const RecentAuctions = () => {
  const navigate = useNavigate();
  const { tfContract, web3, tokerApi } = useData();
  const [auctionLogs, setAuctionLogs] = useState<AuctionStartedLog[]>([]);

  const fetchAuctionLogs = useCallback(async () => {
    const currentBlock = await web3.eth.getBlock("latest");
    const logs = await tfContract.getPastEvents(AuctionFactoryEvents.AuctionStarted, {
      toBlock: "latest",
      fromBlock: Math.max(currentBlock.number - RECENT_BLOCK_INTERVAL, 0),
    });
    const logDetails: AuctionStartedLog[] = logs.map((log: any) => ({ ...log["returnValues"] })).reverse();
    setAuctionLogs(logDetails);
  }, [tfContract, web3.eth]);

  // Listens to Auction created
  useEffect(() => {
    const blockSubcription = tokerApi.subscribeAuctionStarted(fetchAuctionLogs);
    return () => blockSubcription.unsubscribe();
  }, [tokerApi, fetchAuctionLogs]);

  useEffect(() => {
    fetchAuctionLogs();
  }, [fetchAuctionLogs]);

  const EmptyAuctionList = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow flex p-4 py-14 justify-center text-center mt-6">
        <p className="text-lg text-center">
          No auctions has been launched recently. <br /> Click{" "}
          <span className="cursor-pointer text-blue-600" onClick={() => navigate(`${Paths.CREATE_AUCTION}`)}>
            here
          </span>{" "}
          to start one.
        </p>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Recent Auctions</h2>
      {auctionLogs.length === 0 ? (
        <EmptyAuctionList />
      ) : (
        <div className="mt-6 grid lg:grid-cols-3 sm:grid-cols-2 gap-4">
          {auctionLogs.map((auctionLog) => {
            return <AuctionItem key={auctionLog.auctionAddr} auctionLog={auctionLog} />;
          })}
        </div>
      )}
    </div>
  );
};

const TokenListing = () => {
  const navigate = useNavigate();
  const { tokerApi } = useData();
  const [tokenAddrs, setTokenAddrs] = useState<string[]>([]);

  const newTokenCreated = useCallback(async (blockEvent: any) => {
    const newTokenAddr: string = blockEvent["returnValues"]["tokenAddress"];
    setTokenAddrs((addrs) => Array.from(new Set([...addrs, newTokenAddr])));
  }, []);

  // Listens to Token created
  useEffect(() => {
    const blockSubcription = tokerApi.subscribeTokenCreated(newTokenCreated);
    return () => blockSubcription.unsubscribe();
  }, [newTokenCreated, tokerApi]);

  useEffect(() => {
    const initTokenAddrs = async () => {
      const addrs = await tokerApi.fetchAllTokenAddresses();
      setTokenAddrs(addrs);
    };
    initTokenAddrs();
  }, [tokerApi]);

  const EmptyTokenList = () => {
    return (
      <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow md:flex-row  p-4 py-14 text-center">
        <p className="text-lg text-center">
          Launch your own ERC20 token{" "}
          <span className="cursor-pointer text-blue-600" onClick={() => navigate("/create/token")}>
            here
          </span>
        </p>
      </div>
    );
  };
  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Token Listing</h2>
      {tokenAddrs.length === 0 ? (
        <EmptyTokenList />
      ) : (
        <div className="mt-6 grid lg:grid-cols-3 sm:grid-cols-2 gap-4">
          {tokenAddrs.map((tokenAddr) => {
            return <TokenItem key={tokenAddr} tokenAddr={tokenAddr} />;
          })}
        </div>
      )}
    </div>
  );
};

export default Home;
