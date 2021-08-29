//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";


contract Swap{
    // Store swaps
    struct SwapRecord{
        address token; // Address of the ERC20 token
        uint tokenCount; // Number of tokens being sold
        uint price;  // Total cost for the swap (in Eth)
        address seller; // adress of the person selling the eth
        uint index; // The swap's index within the swaps for that currency
        bool active; // A helper variable to keep track of the swap's state
    }

    // Data struction of swaps indexed by:
    // swaps[token][seller]
    // This way each desired token is query-able
    mapping(address => mapping(address => SwapRecord)) private swaps;

    // For any given ERC20 token (address), store all swap offers
    mapping(address => address[]) private currencySwapIndex;

    function _addSwap(SwapRecord memory swap) private{
        // First check if a swap from this address already exists:
        if(swaps[swap.token][swap.seller].active == true){
            _deleteSwap(swap.token, swap.seller);
        }

        // Ensure that if there was a pre-existing swap, it has been removed
        require(swaps[swap.token][swap.seller].active != true, "Error adding swap record.");

        // Get the current index of the swap being added
        uint currentIndex = currencySwapIndex[swap.token].length;

        // add it to the index array:
        currencySwapIndex[swap.token].push(swap.seller);

        // Set the swap to contain the state of its index
        swap.index = currentIndex;

        // set swap in mapping
        swaps[swap.token][swap.seller] = swap;
    }

    function _deleteSwap(address token, address seller) private{
        
        // Require swap to be deleted to exist:
        require(swaps[token][seller].active == true, "Cannot delete swap: swap does not exist");


        // Get the current index of the swap being deleted
        uint currentIndex = swaps[token][seller].index;

        // Delete the swap from mapping
        delete swaps[token][seller];

        // Move the swap with the last index to the delete index
        if(currencySwapIndex[token].length > 1){
            // Move the last record into the space previously occupied by the deleted record
            currencySwapIndex[token][currentIndex] = currencySwapIndex[token][currencySwapIndex[token].length - 1];
            // Delete the (now moved) last record
            currencySwapIndex[token].pop();
        } else{
            // There is only one swap, empty the array
            delete currencySwapIndex[token][0];
        }
        
        // Before completing, ensure that deletion was successful
        require(swaps[token][seller].active != true, "Error: Unknown error deleting swap record");


    }

    function createSwap(address token, uint tokenCount, uint price) public{
        // Creating a new swap should overwrite the previous swap
        _addSwap(SwapRecord(token, tokenCount, price, msg.sender, 0, true));
    }

    function cancelSwap(address token) public {
        // Allows swap issuer to delete their swap
        _deleteSwap(token, msg.sender);
    }

    function querySwaps(address token) public view returns(
        uint[] memory, uint[] memory, address[] memory){
        // For any given token, returns all swap offers for a given token in the form:
        // (amount of tokens (uint), price of tokens (uint), seller (address))

        // Number of tokens being returned by the query
        uint returnSize = currencySwapIndex[token].length;
        
        // Must be more than zero returned records
        require(returnSize > 0, "No swaps found for this currency");

        // Initialise return arrays in memeory
        uint[] memory swapAmounts = new uint[](returnSize);
        uint[] memory prices = new uint[](returnSize);
        address[] memory sellers = new address[](returnSize);
    
        // Copy each swap from storage into memory
        for (uint i = 0; i < returnSize; i++) {
            SwapRecord storage swap = swaps[token][currencySwapIndex[token][i]];
            swapAmounts[i] = swap.tokenCount;
            prices[i] = swap.price;
            sellers[i] = swap.seller;
        } 

        // return
        return (swapAmounts, prices, sellers);
    }

    function fulfil(address ERC20token, address seller) public payable {
        // Copy the swap into memory
        SwapRecord memory swap = swaps[ERC20token][seller];

        IERC20 token = IERC20(swap.token);

        require(swap.price != 0, "Error: Swap doesn't exist");

        // Ensure that enough tokens have been granted to the contract 
        // to facilitate the transfer
        require(token.allowance(address(swap.seller), address(this)) >= swap.tokenCount,
                "Error: seller hasn't deposited token.");

        // Ensure that the buyer has paid enough
        require(msg.value >= swap.price, "Error: buyer hasn't deposted sufficient funds.");

        // Discard Swap, as it's about to be fulfilled
        delete swaps[ERC20token][seller];

        bool sent = token.transferFrom(address(swap.seller), msg.sender, swap.tokenCount);
        require(sent, "Error, ERC20 token did not transfer");

        // Transfer Eth
        (bool success, ) = payable(swap.seller).call{value: msg.value}("");
        require(success, "Transfer failed.");

    }
    
}
