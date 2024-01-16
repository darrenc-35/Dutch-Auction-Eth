const TokerFactory = artifacts.require("TokerFactory");
const { expectRevert } = require("@openzeppelin/test-helpers");

contract("TokerFactory", (accounts) => {
  it("should revert if token name is already in use.", async () => {
    const tfInstance = await TokerFactory.deployed();
    const [tokenName, tokenSymbol, tokenSupply, url] = ["MetaCoin", "MTC", 100, "imageSrc"];
    await tfInstance.createERC20Token(tokenName, tokenSymbol, tokenSupply, url);
    await expectRevert(
      tfInstance.createERC20Token(tokenName, tokenSymbol, tokenSupply, url),
      "Token name is already in use"
    );
  });

  it("should revert if token symbol is already in use.", async () => {
    const tfInstance = await TokerFactory.deployed();
    const [tokenName, tokenSymbol, tokenSupply, url] = ["FileCoin", "FTC", 100, "t"];
    await tfInstance.createERC20Token(tokenName, tokenSymbol, tokenSupply, url);
    await expectRevert(
      tfInstance.createERC20Token("FileCoin2", tokenSymbol, tokenSupply, url),
      "Token symbol is already in use"
    );
  });

  it("should revert if agent is not the token owner.", async () => {
    const tfInstance = await TokerFactory.deployed();
    const tokenAddr = await tfInstance.getTokenAddress("MTC");
    await expectRevert(
      tfInstance.newAuction(tokenAddr, 100, 10, 0, { from: accounts[1] }),
      "You do not have authority to hold an auction for this token"
    );
  });

  it("should revert if symbol is not registered", async () => {
    const tfInstance = await TokerFactory.deployed();
    await expectRevert(tfInstance.getTokenAddress("XXXXX"), "Token not found");
  });

  it("should revert if auction reserve price > start price", async () => {
    const tfInstance = await TokerFactory.deployed();
    const tokenAddr = await tfInstance.getTokenAddress("MTC");
    await expectRevert(
      tfInstance.newAuction(tokenAddr, 100, 0, 1),
      "Reserved price must be smaller or equals to the starting price"
    );
  });

  it("should revert if auction supply is zero", async () => {
    const tfInstance = await TokerFactory.deployed();
    const tokenAddr = await tfInstance.getTokenAddress.call("MTC");
    await expectRevert(tfInstance.newAuction(tokenAddr, 0, 1, 0), "Supply must be more than 0");
  });

  it("should revert if auction address is not registered", async () => {
    const tfInstance = await TokerFactory.deployed();
    await expectRevert(tfInstance.getAuctionAddress(1), "Auction not found");
  });

  it("should revert if mint supply is more than remaining supply", async () => {
    const tfInstance = await TokerFactory.deployed();
    const tokenAddr = await tfInstance.getTokenAddress("MTC");
    await expectRevert(tfInstance.newAuction(tokenAddr, 1000, 1, 0), "Mint amount exceed remaining supply");
  });

  it("should return token address if symbol is registered", async () => {
    const tfInstance = await TokerFactory.deployed();
    const [tokenName, tokenSymbol, tokenSupply, url] = ["Newcoin", "NTC", 100, "imageSrc"];
    await tfInstance.createERC20Token(tokenName, tokenSymbol, tokenSupply, url);
    const tokenAddr = await tfInstance.getTokenAddress("NTC");
    expect(tokenAddr).to.be.ok;
  });

  it("should return auction address if address id is registered", async () => {
    const tfInstance = await TokerFactory.deployed();
    const tokenAddr = await tfInstance.getTokenAddress("NTC");
    await tfInstance.newAuction(tokenAddr, 100, 1, 0);
    const address = await tfInstance.getAuctionAddress(1);
    expect(address).to.be.ok;
  });
});
