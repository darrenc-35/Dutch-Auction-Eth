import React, { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { NumberFormator } from "../utils/utils";
import { useData } from "../context/DataContext";
import { AuctionStartedLog, TokenDetail } from "../types";
import { AuctionItem } from "../components/AuctionItem";
import { AuctionFactoryEvents } from "../constants/contract";
import { PageLoading } from "./PageLoading";
import { PageNotFound } from "./PageNotFound";

const TokenPage = () => {
  const { tokenSymbol } = useParams();
  const { tokerApi } = useData();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<TokenDetail>();
  const tokenLeft = (token?.cappedSupply ?? 0) - (token?.circulatingSupply ?? 0) - (token?.tokenBurnt ?? 0);
  const tokenPoolLeft = ((100 * tokenLeft) / (token?.cappedSupply ?? 1)).toFixed(2);

  useEffect(() => {
    const initTokenDetail = async () => {
      try {
        setLoading(true);
        if (!tokenSymbol) return;
        const tokenAddr = await tokerApi.fetchTokenAddress(tokenSymbol);
        const tokenDetail = await tokerApi.fetchTokenDetail(tokenAddr);
        setToken(tokenDetail);
      } catch (err: any) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    initTokenDetail();
  }, [tokenSymbol, tokerApi]);

  return loading ? (
    <PageLoading />
  ) : !token ? (
    <PageNotFound />
  ) : (
    <div className="mt-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Token Detail</h2>
      <div className="mt-4 mb-8 px-6 py-4 bg-white border border-gray-200 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <img src={token.url} alt="token_image" className="w-6 h-6" />
          <div className="flex gap-2 items-baseline">
            <p className="text-xl font-semibold capitalize">{token.name}</p>
            <span className="uppercase text-xs text-gray-400">{token.symbol}</span>
          </div>
        </div>
        <div className="font-semibold mt-4 text-gray-500 text-md">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 items-center">
              <p>Remaining supply </p>
              <div className="group relative w-max">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 cursor-pointer"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
                <span className="pointer-events-none absolute -top-9 left-0 w-max opacity-0 transition-opacity border border-gray-200 py-1 px-2 group-hover:opacity-100 text-xs">
                  Remaining supply = Total supply - Token burnt - Circulating supply
                </span>
              </div>
            </div>
            <p>
              {NumberFormator.thousand(tokenLeft)} {token.symbol.toUpperCase()}
            </p>
          </div>
          <div className="flex justify-between gap-4 items-center font-semibold mt-1">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${tokenPoolLeft}%` }} />
            </div>
            <span className="text-gray-500 text-xs">({tokenPoolLeft}%)</span>
          </div>
        </div>
        <div className="font-semibold mt-2 text-gray-500 text-md">
          <div className="flex items-center justify-between">
            <p>Max. supply </p>
            <p>
              {NumberFormator.thousand(token.cappedSupply)} {token.symbol.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
      <AuctionList tokenAddr={token.address} />
    </div>
  );
};

const AuctionList = (props: { tokenAddr: string }) => {
  const { tokenAddr } = props;
  const { tfContract, tokerApi } = useData();
  const [loading, setLoading] = useState(false);
  const [auctionLogs, setAuctionLogs] = useState<AuctionStartedLog[]>([]);

  const EmptyAuctionList = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow flex p-4 py-14 justify-center text-center mt-6">
        <p className="text-lg text-center">No auctions has been launched for this token.</p>
      </div>
    );
  };

  useEffect(() => {
    const initAuctionList = async () => {
      try {
        setLoading(true);
        const logs = await tokerApi.fetchTokenAuctionStartedLogs(tokenAddr);
        setAuctionLogs(logs);
      } catch (err: any) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    initAuctionList();
  }, [tokerApi, tokenAddr]);

  return (
    <div className="border-t pt-4">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Past auctions</h2>
      {auctionLogs.length === 0 ? (
        <EmptyAuctionList />
      ) : (
        auctionLogs.map((auctionLog) => (
          <div className="mt-4">
            <AuctionItem key={auctionLog.auctionAddr} auctionLog={auctionLog} />
          </div>
        ))
      )}
    </div>
  );
};
export default TokenPage;
