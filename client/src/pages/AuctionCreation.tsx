import React, { useEffect, useState, Fragment, Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { Spinner } from "../components/Spinner";
import { useData } from "../context/DataContext";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import { EthToWei, extractRpcError } from "../utils/utils";
import { AuctionCreateInputs, TokenDetail } from "../types";
import { useNavigate } from "react-router-dom";
import { Paths } from "../constants/paths";

const SelectBox = (props: {
  selected: string;
  tokens: TokenDetail[];
  selectToken: Dispatch<SetStateAction<string>>;
}) => {
  const { tokens, selected, selectToken } = props;
  const tokenSelected = tokens.filter((token) => token.address === selected)[0];

  return (
    <Listbox value={selected} onChange={selectToken}>
      <div className="relative mt-1">
        <Listbox.Button className="w-full cursor-pointer rounded-lg bg-white  border-t-1 pl-3 pr-10 text-left shadow-md ">
          {tokenSelected ? (
            <div className="flex items-center gap-2 py-2 text-sm">
              <img className="w-6 h-6 ring-1 ring-gray-200 rounded-full" src={tokenSelected.url} alt="token_image" />
              <span className={`capitalize font-semibold`}>{tokenSelected.name}</span>
              <span className={`uppercase items-baseline text-xs text-gray-500`}>{tokenSelected.symbol}</span>
            </div>
          ) : (
            <div className="py-2 text-sm font-gray-500">Select a token:</div>
          )}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {tokens.map((token, tokenIdx) => (
              <Listbox.Option
                key={tokenIdx}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 px-4 ${
                    active ? "bg-amber-100 text-amber-900" : "text-gray-900"
                  }`
                }
                value={token.address}
              >
                {({ selected }) => (
                  <div className="flex items-center gap-2">
                    <img className="w-6 h-6 ring-1 ring-gray-200 rounded-full" src={token.url} alt="token_image" />
                    <div className="items-baseline">
                      <span className={`capitalize font-semibold`}>{token.name}</span>
                      <span className={`ml-2 uppercase items-baseline text-xs text-gray-500`}>{token.symbol}</span>
                    </div>
                    {selected ? (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-amber-600">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </div>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

const AuctionCreation = () => {
  const navigate = useNavigate();
  const { tokerApi } = useData();
  const [selectToken, setSelectToken] = useState<string>("");
  const [ownedTokens, setOwnedTokens] = useState<TokenDetail[]>([]);

  useEffect(() => {
    const initOwnedTokens = async () => {
      const tokens = await tokerApi.fetchOwnedTokens();
      setOwnedTokens(tokens);
    };
    initOwnedTokens();
  }, [tokerApi]);

  return (
    <div className="justify-center mt-4 max-w-xl mx-auto">
      <div className="px-6 py-4 bg-white border border-gray-200 rounded-lg shadow min-w-lg">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Auction Creation</h2>
        <div className="mt-4">
          {ownedTokens.length === 0 ? (
            <div>
              <p>
                Please{" "}
                <span
                  onClick={() => navigate(Paths.CREATE_TOKEN)}
                  className="hover:underline text-blue-700 cursor-pointer"
                >
                  create
                </span>{" "}
                a token before starting an auction
              </p>
            </div>
          ) : (
            <SelectBox selected={selectToken} selectToken={setSelectToken} tokens={ownedTokens} />
          )}
        </div>
        {selectToken && <AuctionForm tokenAddr={selectToken} tokens={ownedTokens} />}
      </div>
    </div>
  );
};

const AuctionForm = (props: { tokenAddr: string; tokens: TokenDetail[] }) => {
  const {
    reset,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AuctionCreateInputs>();

  const { tokenAddr, tokens } = props;
  const { tokerApi } = useData();
  const [submitLoading, setSubmitLoading] = useState(false);
  const token = tokens.filter((token) => token.address === tokenAddr)[0];
  const remainingSupply = token.cappedSupply - token.circulatingSupply - token.tokenBurnt;

  const createAuction = async ({ supply, startPrice, reservedPrice }: AuctionCreateInputs) => {
    if (reservedPrice > startPrice) {
      setError("reservedPrice", { type: "custom", message: "Must be smaller than start price" });
      return;
    }
    setSubmitLoading(true);
    const startPriceWei = EthToWei(startPrice);
    const reservedPriceWei = EthToWei(reservedPrice);
    try {
      await tokerApi.createAuction(tokenAddr, supply, startPriceWei, reservedPriceWei);
      toast.success(`Auction for ${token.symbol.toUpperCase()} has successfully been started!`);
      reset();
    } catch (err) {
      toast.error(extractRpcError(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(createAuction)}>
      <div className="grid md:grid-cols-2 md:gap-6 mt-6">
        <div className="w-full mb-6 group">
          <label htmlFor="reservedPrice" className="text-xs text-gray-500">
            Reserved price
          </label>
          <input
            type="number"
            step="any"
            {...register("reservedPrice", {
              required: "This is required",
              min: { value: 0.001, message: "Minimum price: 0.001" },
              max: { value: 10, message: "Maximum price: 10" },
              setValueAs: (value) => parseFloat(value),
            })}
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          />
          <span className="text-xs text-red-400">{errors.reservedPrice?.message}</span>
        </div>
        <div className="w-full mb-6 group">
          <label htmlFor="start_price" className="text-xs text-gray-500">
            Start price
          </label>
          <input
            type="number"
            step="any"
            {...register("startPrice", {
              required: "This is required",
              min: { value: 0.001, message: "Minimum price: 0.001" },
              max: { value: 10, message: "Maximum price: 10" },
              setValueAs: (value) => parseFloat(value),
            })}
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          />
          <span className="text-xs text-red-400">{errors.startPrice?.message}</span>
        </div>
      </div>
      <div className="w-full mb-6 group">
        <label htmlFor="supply" className="text-xs text-gray-500">
          Mint supply (max. {remainingSupply})
        </label>
        <input
          type="number"
          {...register("supply", {
            required: "This is required",
            min: { value: 1, message: "Minimum supply: 1" },
            max: {
              value: `${remainingSupply}`,
              message: `Cannot exceed ${remainingSupply}`,
            },
            setValueAs: (value) => parseInt(value),
          })}
          className="block py-2.5 px-0 w-full text-sm text-gray-900  border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        />
        <span className="text-xs text-red-400">{errors.supply?.message}</span>
      </div>

      <button
        type="submit"
        disabled={submitLoading}
        className="text-white bg-blue-700 hover:bg-blue-800 cursor-pointer flex items-center gap-2 justify-center disabled:cursor-not-allowed w-full py-2.5 px-5 mr-2 mb-2 disabled:text-slate-500 disabled:bg-gray-200 text-sm font-medium focus:outline-none rounded-full border border-gray-200 focus:z-10 focus:ring-4 focus:ring-gray-200"
      >
        Start Auction {submitLoading && <Spinner />}
      </button>
    </form>
  );
};

export default AuctionCreation;
