# SimpleSwap
A simple ERC20 swap contract.\

### Supports:
* All ERC20 tokens
* Querying available swap offers by currency
* Updating, deleting swap offers
* more coming soon

### TODO:
* Add support for ERC20<=>ERC20 swaps (Currently just ERC20=>ETH).
* Write more tests, specifically test edge cases. 
* Reduce gas usage.
* Security audit.

### Test:
```
cd simpleSwap
npm install 
npx hardhat test
```