// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.21;

import "./DutchAuction.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

contract ERC20Token is ERC20Capped, ERC20Burnable {

    // Struct to store token details.
    struct TokenDetails {
        string  name;
        string  symbol;
        uint256 cirSupply;
        uint256 cappedSupply;
        uint256 tokenBurnt;
        string  url;
    }

    address private owner;
    string public url;
    uint256 public tokenBurnt;

    // Constructor to initialize the ERC20 token.
    constructor(string memory _name, string memory _symbol, uint256 _supply, string memory _url) ERC20(_name, _symbol) ERC20Capped(_supply) { 
        url = _url;
        owner = msg.sender;
    }

    // Internal function to update the token state when transfers occur.
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Capped) {
        super._update(from, to, value);

        // Keep track of the token burnt after end of dutch auction.
        if (to == address(0)){
            tokenBurnt += value;
        }
        
        if (from == address(0)) {
            uint256 maxSupply = cap();
            uint256 supply = totalSupply();
            // Ensure that token burning does not exceed the cap.
            if ((tokenBurnt + supply) > maxSupply) {
                revert ERC20ExceededCap(supply, maxSupply);
            }
        }
    }

    // Mint new tokens. Only the owner of the contract can mint tokens.
    function mint(address account, uint256 value) public {
        require(msg.sender == owner, "You have no authority to mint this token");
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        uint256 remainingTokens = this.cap() - this.totalSupply() - tokenBurnt;
        require(remainingTokens >= value, "Mint amount exceed remaining supply");
        _update(address(0), account, value);
    }

    // Get the details of the token.
    function getDetails() public view returns (TokenDetails memory) {
        TokenDetails memory details;

        details.name = this.name();
        details.symbol = this.symbol();
        details.cirSupply = this.totalSupply();
        details.cappedSupply = this.cap();
        details.url = url;
        details.tokenBurnt = tokenBurnt;

        return details;
    }
}

contract TokerFactory {
    
    // Events for tracking contract actions.
    event EtherReceived(address indexed sender, uint256 amount);
    event TokenCreated(address indexed owner, address indexed tokenAddress, string name, string symbol, uint256 supply);
    event AuctionStarted(address auctionAddr, address indexed tokenAddr, uint256 startTime);
    
    address [] public tokenAddrs;
    mapping(string => address) private nameToTokenAddr;
    mapping(string => address) private symbolToTokenAddr;
    mapping(address => address) private tokenToOwner;

    
    uint256 private auctionID;
    address [] public auctionAddrs;
    mapping(uint256 => address) private idToAddr;
    mapping(address => address[]) private tokenAddrToAuctionAddrs;

    // Create a new ERC20 token.
    function createERC20Token(string calldata _name, string calldata _symbol, uint256 _supply, string calldata _url ) external payable returns (address) {
        require(nameToTokenAddr[_name] == address(0), "Token name is already in use");
        require(symbolToTokenAddr[_symbol] == address(0), "Token symbol is already in use");

        ERC20Token newToken = new ERC20Token(_name, _symbol, _supply, _url);
        tokenAddrs.push(address(newToken));
        nameToTokenAddr[_name] = address(newToken);
        symbolToTokenAddr[_symbol] = address(newToken);
        tokenToOwner[address(newToken)] = msg.sender;

        emit TokenCreated(msg.sender, address(newToken), _name, _symbol, _supply);
        return address(newToken);
    }

    // Ensures that msg.sender is the owner of the token, only the token owner can hold auctions.
    function newAuction(address _tokenAddr, uint256 _supply, uint256 _startPrice, uint256 _reservedPrice) public returns(address newAuctionAddr){
        require(tokenToOwner[_tokenAddr] == msg.sender, "You do not have authority to hold an auction for this token");
        auctionID++;
        DutchAuction da = new DutchAuction(auctionID, _tokenAddr, _supply, _startPrice, _reservedPrice);
        ERC20Token token = ERC20Token(_tokenAddr);
        token.mint(address(da), _supply);
        auctionAddrs.push(address(da)); 
        idToAddr[auctionID] = address(da);
        tokenAddrToAuctionAddrs[_tokenAddr].push(address(da));
        emit AuctionStarted(address(da), _tokenAddr, block.timestamp);
        return address(da);
    }

    // Get the address of an auction by its ID.
    function getAuctionAddress(uint256 _auctionId) public view returns (address) {
        address auctionAddress = idToAddr[_auctionId];
        require(auctionAddress != address(0), "Auction not found");
        return auctionAddress;
    }
    
    // Get all auction addresses.
    function getAllAuctionAddresses() public view returns (address[] memory) {
        return auctionAddrs;
    }

    // Get the address of a token by its symbol.
    function getTokenAddress(string calldata _symbol) public view returns (address) {
        address tokenAddress = symbolToTokenAddr[_symbol];
        require(tokenAddress != address(0), "Token not found");
        return tokenAddress;
    }

    // Get all token addresses.
    function getAllTokenAddresses() public view returns (address[] memory) {
        return tokenAddrs;
    }

}
