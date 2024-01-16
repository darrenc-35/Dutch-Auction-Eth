const Web3 = require("web3");
const web3 = new Web3("ws://localhost:7545");

setInterval(async () => {
  await web3.currentProvider.send(
    {
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [],
      id: new Date().getTime(),
    },
    (err, result) => {
      // need to resolve the Promise in the second callback
      web3.eth.getBlock("latest").then((block) => {
        console.log(`Block ${block.number} mined`);
      });
    }
  );
}, 5000);
