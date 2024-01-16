import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { NumberFormator } from "../utils/utils";
import { CountdownTimer } from "./CountdownTimer";
import { useData } from "../context/DataContext";
import { AuctionDetail, AuctionStartedLog, TokenDetail } from "../types";
import { AuctionItemSkeleton } from "./Placeholder";
import { Paths } from "../constants/paths";

export const AuctionItem = (props: { auctionLog: AuctionStartedLog }) => {
  const { tokenAddr, auctionAddr } = props.auctionLog;

  const { tokerApi } = useData();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<TokenDetail>();
  const [auction, setAuction] = useState<AuctionDetail>();

  useEffect(() => {
    const fetchAuctionDetail = () => {
      tokerApi
        .fetchAuctionDetail(auctionAddr)
        .then((auctionDetail) => {
          setAuction(auctionDetail);
        })
        .catch(console.log);
    };
    const blockSubcription = tokerApi.subscribeAuctionBlock(fetchAuctionDetail);
    return () => blockSubcription.unsubscribe();
  }, [tokerApi, auctionAddr]);

  useEffect(() => {
    const initAuctionItem = async () => {
      try {
        setLoading(true);
        const tokenDetail = await tokerApi.fetchTokenDetail(tokenAddr);
        const auctionDetail = await tokerApi.fetchAuctionDetail(auctionAddr);
        setToken(tokenDetail);
        setAuction(auctionDetail);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    initAuctionItem();
  }, [tokerApi, tokenAddr, auctionAddr]);

  return loading || !token || !auction ? <AuctionItemSkeleton /> : <AuctionItemCard auction={auction} token={token} />;
};

const AuctionItemCard: React.FC<{ auction: AuctionDetail; token: TokenDetail }> = ({ auction, token }) => {
  const navigate = useNavigate();
  const progressWidth = ((100 * auction.remainingSupply) / auction.totalSupply).toFixed(2);

  return (
    <div
      onClick={() => navigate(`${Paths.AUCTION}${auction.id}`)}
      className="cursor-pointer bg-white border border-gray-200 rounded-lg shadow md:flex-row hover:bg-gray-100 p-4 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <img src={token.url} alt="token_image" className="w-6 h-6 rounded-full" />
        <div className="flex gap-2 items-baseline">
          <p className="text-xl font-semibold capitalize">{token.name}</p>
          <span className="uppercase text-xs text-gray-600">{token.symbol}</span>
        </div>
      </div>
      <div className="font-semibold mt-4 text-gray-500 text-sm">
        <div className="flex items-center justify-between">
          <p>Time left</p>
          <CountdownTimer hasEnded={auction.hasEnded} targetDate={auction.endTime} />
        </div>
        <div className="flex items-center justify-between">
          <p>Current price</p>
          <p>{auction.currentPrice.toFixed(6)} Eth</p>
        </div>
        <div className="flex items-center justify-between border-t pt-2 mt-2">
          <p>Supply left</p>
          <p>
            {NumberFormator.thousand(auction.remainingSupply)} / {NumberFormator.thousand(auction.totalSupply)}{" "}
            {token.symbol.toUpperCase()}
          </p>
        </div>
        <div className="flex justify-between gap-4 items-center font-semibold mt-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progressWidth}%` }} />
          </div>
          <span className="text-gray-500 text-xs">({progressWidth}%)</span>
        </div>
      </div>
    </div>
  );
};
