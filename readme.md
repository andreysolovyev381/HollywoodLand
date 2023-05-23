# Smart Contracts

## IMPORTANT
### Must-do remove before deploy
There are some functions used for testing purposes only, each of them is marked with 'todo:' mark. They MUST be removed before ANY real deployment. 

## General structure
### Proxy Implementation
Made by using TransparentUpgradeableProxy paradigm from OpenZeppelin. All the data storages were separated from the respective implementations. Storages contain "storage" in their names, and implementations contain "implementation". 
### Native Token
Contract is ERC20 and ERC777 compatible foundation for all the operations (upd: after audit Client made a decision to remove ERC777 hooks functionality - see [See the Amendmens after Audit](#amendments-done-after-audit-completion)).
Consists of two parts:
##### Token
Token per se.
##### PriceOracle
A mechanism to set the price manually. Is designed to serve the requests from the UI for the USD-nominated sales.
### Finance
Is represented by three contracts, responsible for:
- stakes (investments into a project)
- debt (debt of a project)
- revenues (managing revenues distribution in accordance with the stakes)
### ProjectCatalog
Contract, responsible for holding a Project Catalog, manages Projects. It moves Projects through the stages (called Road Blocks).
### NFTMarketplace
Set of three contracts, responsible for holding NFTs. Contextualy, everything in the system is an NFT - a project, a piece of art, stake in a project, collection. It provides an ability to trade anything. 
For the projects there are other type of trading - through the Stakes. One can consolidate the stakes that way consolidating quasi-equity.
Sale is organized in two transactions:
1) owner approves operator (a buyer) and fixes a price he wants to sell an NFT for;
2) buyer, who is an operator for particular NFT after 1), transfers NFT to another address, and uses as one of the arguments of a transferNFT() pre-agreed price that was entered by the owner. If anything mismatches then contract reverts.
Three contracts constitute the Marketplace:
##### NFTCatalog
Holds all the NFTs.
##### NFTOwnership
Holds ownership of NFTs, is analogous to ERC1155.
##### NFTTransactionPool
Operates with transactions, holds them until they are executed.
### Governor and GovernorToken
OZ implementation of Governor Compound Bravo Compatible and GovernorToken as ERC20Votes contracts was taken as a base, but the complexity comes from the NFT structure.
A person that holds Tokens and Project Stakes for a particualr project has the options to do the following:
- delegate both Tokens and Project Stakes for a system-wide proposal vote
- delegate both Tokens and Project Stakes for a project specific proposal vote if this project is the same as Stakes are issued for.
- delegate ONLY Tokens for a project specific proposal vote, if such project differs from the one that such person holds Stakes for.

## Smart Contracts Naming Conventions and Project Structure 
### Naming
Each contract is placed in a separate folder. Name of such folder corresponds with a purpose of Contract. As it was "**TransparentUpgradable**" architecture selected, therefore each Smart Contract consists of several parts. Assume there is a Contract that has a purpose of selling things and that is called "Shop". In this case, this contract can be found in folder "/contracts/Shop" and Naming of the contract parts will be the following:
- Shop*Proxy*: part of the contract, that serves as an interface, allows to change the business logic implementation and fallbacks all the business queries to such a logic; 
- Shop*Storage*: Storage of a respected contract. Part, that is designed to keep contract's data on-chain;
- Shop*Implementation*: Business logic of a respected contract, that works with data, kept in Shop*Storage* and that can be changed by Shop*Proxy*;
- *I*Shop: interface of a contract, that is to be used by other contracts of entire contract set if there is a need for that.
### Contracts Folder Structure
```
contracts
└───Finance
│   └───DebtManager  
│   │   // some comments for DebtManager folder, that contains:
│   │   // - proxy, 
│   │   // - storage,
│   │   // - implementaion (logic),
│   │   // - interface
│   │   // of a contract, reponsible for Debt.
│   │   // See General structure section for
│   │   // contracts business description, as well as BRD.
│   │   // Other contract folders are more or less the same. 
│   └───RevenuesManager
│   └───StakesManager
└───Governance
│   └───GovernanceToken  
│   └───Governor
│   └───GovernorCore //Governor inheritance structure
└───Libs //third party's libs, own libs
└───Mocks //UPD: contract mocks, used for testing
└───NFT
│   └───Libs //NFT's specific libs  
│   └───NFT_TransactionPool
│   └───NFTCatalog
│   └───NFTOwnership
└───ProjectCatalog
└───Token
    └───PriceOracle  
    └───Token 

```
---
## Amendments done after Audit Completion
### Audit Findings
The contracts were audited, here is the [first round findings](https://solidity.finance/audits/HollywoodLand/ "Audit Findings").
Issues were addressed the following way:
* **Finding #1** 
  * ... Recommendation: An NFT's price should not be updated until the implementTransaction() function is called to ensure the NFT was actually purchased at the value last_price is being set.
  * Code amended: NFTCatalogImplementation.sol, lines 264, 316


* **Finding #2** 
  * ... Recommendation: The fromTokensToEther() function should either check the msg.sender's balance and transfer the tokens from the msg.sender or check the to address' balance and send the tokens from the to address.
  * Code amended: TokenImplementation.sol, line 89


* **Finding #3**
  * ... Recommendation: Checking that only the msg.value is equal to the transaction price is sufficient.
  * Code amended: NFTCatalogImplementation.sol, line 287-290


* **Finding #4**  
  * Recommendation: The team should consider only allowing Project owners to mint or implementing a mint allowance system for Projects.
  * Code amended: 
    * NFTCatalogImplementation.sol, lines 150-152
    * nft_catalog_business_requirements.js, block of tests at lines 1036-1200


* **Finding #5** 
  * ... Recommendation: The addStakes() function should be called before transferring the ERC777 tokens.
  * Code amended: StakesManagerImplementation.sol, line 107


* **Finding #6**
  * ... Recommendation: The registerRevenue() function should check a revenue does not already exist for the project at the current. 
  * Code amended: 
    * RevenuesManagerImplementation.sol, line 94
    * finance_business_requirements.js, line 1304


* **Finding #7**
  * ... Recommendation: The team should consider disabling Governance Token transfers so the intended functionality is more apparent.
  * Code amended:
    * GovernanceTokenProxy.sol, some lines were removed
    * GovernanceTokenImplementation.sol, some lines were removed, lines 418-428 added
    * GovernanceTokenStorage.sol, lines 15-20
    * governance_token_business_requirements.js, lines 759-766, some other technical changes - ie, update of a project_id value inside of a test

### Other amendments
* **ERC777 HOOKS**: As per Client's request, some of Token's (so called "native token") methods were removed to reduce the risks of using ERC777 functionality. Specifically, "hooks" related functions as well as their usage were removed from the code.
  * Files affected:
    * TokenImplementation.sol, removed hooks;
    * ERC777Wrapper.sol, removed hooks;
    * ERC777.behavior.js, tests amended to reflect hooks absence; 
    * token_as_ERC777.js **refactored to** token_as_ERC.js, tests amended to reflect hooks absence.
  * **NOTE!** However, ERC777WrapperStorage.sol - a storage for Token, still contains the data structures for the hooks, as the Client may consider using them in the future by changing logic of this upgradable contract.
  * Other contracts' functions and events containing "ERC777" were refactored to contain "NativeToken".
* **GOVERNOR CONTRACT**: became available for testing, so the following changes were introduced:
  * Contract was _heavily_ refactored;
  * After testing started, another contract mock appeared (two contract mocks in total now), therefore there is a new folder contracts/Mocks, that contains the mocks;
  * GovernorCore was moved to contracts/Libs as GovernorCoreWrapper.
* **MINOR REFACTORING** 
  * **UPGRADEABLE** feature - introduced Libs/InheritanceHelpers.sol, that helps to straighten up inheritance hierarchy;
