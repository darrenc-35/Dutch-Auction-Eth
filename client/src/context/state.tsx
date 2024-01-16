const actions = {
  init: "INIT",
  setCurrentAccount: "SET_CURRENT_ACCOUNT",
};

const initialState = {
  artifact: null,
  web3: null,
  accounts: null,
  networkID: null,
  contract: null,
  currentAccount: null,
};

const reducer = (state: any, action: any) => {
  const { type, data } = action;
  switch (type) {
    case actions.init:
      return { ...state, ...data };
    case actions.setCurrentAccount:
      return { ...state, currentAccount: data };
    default:
      throw new Error("Undefined reducer action type");
  }
};

export { actions, initialState, reducer };
