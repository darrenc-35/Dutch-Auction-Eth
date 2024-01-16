// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./TokerFactory.sol";

contract DutchAuction {
    using Math for uint256;

    // Events to log important contract actions.
    event BidSubmitted(address indexed bidder, uint256 qty, uint256 price);
    event AuctionStarted(uint256 startTime);
    event AuctionEnded(uint256 endTime);
    event TokenTransfered(address indexed bidder, uint256 qty, uint256 value);
    event EthRefunded(address indexed bidder, uint256 amt);
    event TokenBurned(address tokenAddr, uint256 qty);

    uint256 private constant DURATION = 20 minutes;
    uint256 private constant INTERVAL_TIME = 30 seconds;
    uint256 private constant TOTAL_INTERVALS = DURATION / INTERVAL_TIME;

    uint256 public id;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public startPrice;
    uint256 public supply;
    uint256 public currentPrice;
    bool public hasEnded;
    uint256 private reservedPrice;
    uint256 private ethHolding;
    address[] private biddersAddr;

    mapping(address => uint256) public bids;

    ERC20Token token;

    // Struct to represent auction details.
    struct AuctionDetails {
        uint256 id;
        bool hasEnded;
        uint256 startTime;
        uint256 endTime;
        uint256 currentPrice;
        uint256 totalSupply;
        uint256 remainingSupply;
    }

    // Constructor to initialize the Dutch auction.
    constructor(
        uint256 _id,
        address _tokenAddress,
        uint256 _supply,
        uint256 _startPrice,
        uint256 _reservedPrice
    )   {
        require(_tokenAddress != address(0));
        require(_supply > 0, "Supply must be more than 0");
        require(_startPrice >= _reservedPrice, "Reserved price must be smaller or equals to the starting price");

        token = ERC20Token(_tokenAddress);

        id = _id;
        supply = _supply;
        startPrice = _startPrice;
        currentPrice = _startPrice;
        reservedPrice = _reservedPrice;
        ethHolding = 0;
        hasEnded = false;

        startTime = block.timestamp;
        endTime = block.timestamp + DURATION;

        emit AuctionStarted(startTime);
    }

    // Calculate the current token price based on the time passed.
    function getCurrentPrice() public view returns (uint256) {
        if (hasEnded){
            return currentPrice;
        } else {
            uint256 blockPassed = (block.timestamp - startTime) / INTERVAL_TIME;
            if (blockPassed >= TOTAL_INTERVALS){
                return reservedPrice;
            }
            return startPrice - ((startPrice - reservedPrice) * blockPassed / TOTAL_INTERVALS);
        }
    }

    // Calculate the remaining supply based on current valuation.
    function getRemainingSupply() public view returns (uint256) {
        uint256 tokens = ethHolding / getCurrentPrice();
        // (1) Auction has ended -> remaining supply are burnt.
        if (tokens >= supply || hasEnded){
            return 0;
        }
        return supply - tokens;
    }

   // Calculate the valuation of the current remaining supply.
    function getRemainingSupplyValue() private view returns (uint256){
        return getRemainingSupply() * getCurrentPrice();
    }



    function bid() public payable {
        currentPrice = getCurrentPrice();
        require(getRemainingSupply() > 0, "No more tokens left to bid for");
        require(block.timestamp >= startTime, "Auction has yet to start");
        require(msg.value >= currentPrice, "Insufficient bidding value");

        // Exceeded auction period, time to end auction.
        if (block.timestamp >= endTime){
            endDutchAuction();
            require(block.timestamp <= startTime, "Auction has already ended");
            return;
        }

        uint256 refund = 0;
        uint256 remainingSupplyValue = getRemainingSupplyValue();
        
        // Refund user for the excess amount.
        if (msg.value > remainingSupplyValue) {
            refund = msg.value - remainingSupplyValue;
            payable(msg.sender).transfer(refund);
            emit EthRefunded(msg.sender, refund);
        }

        uint256 bidValue = msg.value - refund;
        bids[msg.sender] += bidValue;
        ethHolding += bidValue;
        addBidder(msg.sender);

        emit BidSubmitted(msg.sender, (bidValue/currentPrice), bidValue);

        // End auction if there are no remaining supply.
        if (getRemainingSupply() == 0){
            endDutchAuction(); 
        }
    }

    // End the Dutch auction and distribute tokens to bidders.
    function endDutchAuction() public {
        require(hasEnded == false, "Auction has already ended");
        require(getRemainingSupply() == 0 || block.timestamp > endTime, "Auction can't be ended yet.");
        
        currentPrice = getCurrentPrice();
        uint256 remainingSupply = getRemainingSupply();

        // Distribute the token supply to the bidders.
        for (uint256 i = 0; i < biddersAddr.length; i++){
            uint256 tokenAmount = 0;
            address receiptAddr = biddersAddr[i];
            // If there's no remaining supply -> Distribute by percentage, else distribute by current value.
            // Reason: To combat edge case whereby an user initial bid passed, but when calculating the actual token to be distributed by currentPrice, it exceeds the supply amount.
            if (remainingSupply == 0){
                tokenAmount = supply * bids[receiptAddr] / ethHolding;
            } else {
                tokenAmount = bids[receiptAddr] / currentPrice; // HERE, it will exceed
            }
            token.transfer(receiptAddr, tokenAmount);
            emit TokenTransfered(receiptAddr, tokenAmount, bids[receiptAddr]);
        }

        // Burn the remaining tokens if any.
        burnTokens();

        hasEnded = true;
        emit AuctionEnded(block.timestamp);
    }

    // Burn any remaining tokens in the contract.
    function burnTokens() private {
        if (token.balanceOf(address(this)) == 0){
            return;
        }
        uint256 remainingTokens = token.balanceOf(address(this));
        token.burn(remainingTokens);
        emit TokenBurned(address(token), remainingTokens);
    }

    // Add a new bidder to the list of bidders.
    function addBidder(address newBidder) private {
        for (uint256 i = 0; i < biddersAddr.length; i++) {
            if (biddersAddr[i] == newBidder) {
                return;
            }
        }
        biddersAddr.push(newBidder);
    }

    // Get the details of the auction.
    function getDetails() public view returns (AuctionDetails memory) {

        AuctionDetails memory details;

        details.id = id;
        details.startTime = startTime;
        details.endTime = endTime;
        details.totalSupply = supply;
        details.hasEnded = hasEnded;
        details.currentPrice = getCurrentPrice();
        details.remainingSupply = getRemainingSupply();
        return details;
    }

    // Get the address of the ERC20 token being auctioned.
    function getTokenAddr() public view returns (address) {
        return address(token);
    }
}
