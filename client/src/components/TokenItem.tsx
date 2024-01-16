import { useNavigate } from "react-router-dom";
import { NumberFormator } from "../utils/utils";
import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { TokenDetail } from "../types";
import { TokenItemSkeleton } from "./Placeholder";
import { Paths } from "../constants/paths";

export const TokenItem: React.FC<{ tokenAddr: string }> = ({ tokenAddr }) => {
  const { tokerApi } = useData();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<TokenDetail>();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        const tokenDetail = await tokerApi.fetchTokenDetail(tokenAddr);
        setToken(tokenDetail);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [tokenAddr, tokerApi]);

  return loading || !token ? <TokenItemSkeleton /> : <TokenItemCard token={token} />;
};

const TokenItemCard: React.FC<{ token: TokenDetail }> = ({ token }) => {
  const navigate = useNavigate();
  const tokenLeft = token.cappedSupply - token.circulatingSupply - token.tokenBurnt;
  const progressWidth = ((100 * tokenLeft) / token.cappedSupply).toFixed(2);
  return (
    <div
      onClick={() => navigate(`${Paths.TOKEN}${token.symbol}`)}
      className="cursor-pointer bg-white border border-gray-200 rounded-lg shadow md:flex-row md:max-w-xl hover:bg-gray-100 p-4 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <img src={token.url} alt="token_image" className="w-6 h-6 ring-1 ring-gray-200 rounded-full" />
        <div className="flex gap-2 items-baseline">
          <p className="text-xl font-semibold capitalize">{token.name}</p>
          <span className="uppercase text-xs text-gray-600">{token.symbol}</span>
        </div>
      </div>
      <div className="font-semibold mt-4 text-gray-500 text-sm">
        <div className="flex items-center justify-between">
          <p>Tokens left </p>
          <p>
            {NumberFormator.thousand(tokenLeft)} {token.symbol.toUpperCase()}
          </p>
        </div>
        <div className="flex justify-between gap-4 items-center font-semibold mt-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progressWidth}%` }} />
          </div>
          <span className="text-gray-500 text-xs">({progressWidth}%)</span>
        </div>
      </div>
      <div className="font-semibold mt-2 text-gray-500 text-sm border-t pt-2 ">
        <div className="flex items-center justify-between">
          <p>Max. supply </p>
          <p>
            {NumberFormator.thousand(token.cappedSupply)} {token.symbol.toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
};
