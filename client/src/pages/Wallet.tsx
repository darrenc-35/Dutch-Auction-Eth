import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { TokenDetail } from "../types";
import { useNavigate } from "react-router-dom";
import { Paths } from "../constants/paths";

const Wallet = () => {
  const { tfContract } = useData();
  const [tokenAddrs, setTokenAddrs] = useState([]);

  useEffect(() => {
    const fetchTokenAddresses = async () => {
      const addrs = await tfContract.methods.getAllTokenAddresses().call();
      setTokenAddrs(addrs);
    };
    fetchTokenAddresses();
  }, [tfContract]);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Token Holdings</h2>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-4">
        <table className="w-full text-sm text-left text-gray-500 ">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Symbol
              </th>
              <th scope="col" className="px-6 py-3">
                Holding
              </th>
              <th scope="col" className="px-6 py-3">
                Token Burnt
              </th>
              <th scope="col" className="px-6 py-3">
                Circulating supply
              </th>
              <th scope="col" className="px-6 py-3">
                Capped supply
              </th>
            </tr>
          </thead>
          <tbody>
            {tokenAddrs.map((tokenAddr) => (
              <TokenBalance key={tokenAddr} tokenAddr={tokenAddr} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TokenBalance = (props: { tokenAddr: string }) => {
  const { tokenAddr } = props;
  const navigate = useNavigate();
  const { tokerApi } = useData();
  const [currentBalance, setCurrentBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<TokenDetail>();
  useEffect(() => {
    const initTokenDetail = async () => {
      try {
        setLoading(true);
        const tokenDetail = await tokerApi.fetchTokenDetail(tokenAddr);
        const balance = await tokerApi.fetchTokenBalance(tokenAddr);
        setToken(tokenDetail);
        setCurrentBalance(balance);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    initTokenDetail();
  }, [tokenAddr, tokerApi]);

  return !token ? (
    <></>
  ) : (
    <tr className="bg-white border-b hover:bg-gray-50">
      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap capitalize flex gap-2">
        <img src={token.url} alt="token_image" className="w-5 h-5 rounded-full" />
        <span
          className="font-semibold hover:underline cursor-pointer"
          onClick={() => navigate(`${Paths.TOKEN}${token.symbol}`)}
        >
          {token.name}
        </span>
      </th>
      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap uppercase">
        {token.symbol}
      </th>
      <td className="px-6 py-4">{currentBalance}</td>
      <td className="px-6 py-4">{token.tokenBurnt}</td>
      <td className="px-6 py-4">{token.circulatingSupply}</td>
      <td className="px-6 py-4">{token.cappedSupply}</td>
    </tr>
  );
};

export default Wallet;
