import Web3 from "web3";
import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { reducer, actions, initialState } from "./state";
import TokerFactoryContract from "../contracts/TokerFactory.json";
import { toast } from "react-toastify";
import { TokerApi } from "../api";

interface DataState {
  artifact: null;
  web3: any;
  tfContract: any;
  account: string;
  networkID: string;
  tokerApi: TokerApi;
}

interface DataContextType extends DataState {
  dispatch: React.Dispatch<any>;
  initWeb3: (artifact: any, sendToast: boolean) => void;
}

const web3 = new Web3(Web3.givenProvider);
web3.eth.handleRevert = true;

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initWeb3 = useCallback(async (tfArtifact: any = TokerFactoryContract, sendToast: boolean = false) => {
    if (tfArtifact) {
      try {
        const account = (await web3.eth.requestAccounts())[0];
        const networkID = (await web3.eth.net.getId()).toString();
        web3.eth.defaultAccount = account;
        try {
          const address = tfArtifact.networks[networkID as keyof typeof tfArtifact.networks].address;
          const tfContract = new web3.eth.Contract(tfArtifact.abi, address);
          const tokerApi = new TokerApi(web3, tfContract, account);
          dispatch({
            type: actions.init,
            data: { web3, account, networkID, tfContract, currentAccount: 0, tokerApi },
          });
        } catch (err: any) {}
      } catch (err: any) {
        // Probably Request already pending or no provider
        if (sendToast) {
          if (err?.code === -32002) {
            toast.error("Please complete your MetaMask request.");
          } else {
            console.log(err);
            toast.error("Error accessing Ethereum account:", err);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const tryInit = async () => {
      try {
        initWeb3();
      } catch (err) {
        console.error(err);
      }
    };
    tryInit();
  }, [initWeb3]);

  useEffect(() => {
    const events = ["chainChanged", "accountsChanged"];
    const handleChange = () => {
      initWeb3();
    };

    events.forEach((e) => window.ethereum.on(e, handleChange));
    return () => {
      events.forEach((e) => window.ethereum.removeListener(e, handleChange));
    };
  }, [initWeb3, state.tfContract]);

  return <DataContext.Provider value={{ ...state, initWeb3, dispatch }}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
