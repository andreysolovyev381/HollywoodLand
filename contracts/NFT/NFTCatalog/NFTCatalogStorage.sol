//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../Libs/NFTStructs.sol";

import "../../Libs/IERC777Wrapper.sol";
import "../../Finance/DebtManager/IDebtManager.sol";
import "../../Finance/StakesManager/IStakesManager.sol";
import "../../Finance/RevenuesManager/IRevenuesManager.sol";
import "../../ProjectCatalog/IProjectCatalog.sol";
import "../../Governance/GovernanceToken/IGovernanceToken_.sol";
import "../NFTOwnership/INFTOwnership.sol";
import "../NFT_TransactionPool/INFT_TransactionPool.sol";

import "../../Libs/EternalStorage.sol";
import "../../Libs/ProxyStorage.sol";
import "../../Libs/IterableSet.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTCatalogStorage_SpecificStorage is ProxyStorage {

    //Where the tokens are either earned or spent
    address internal m_company_account;

    IERC777Wrapper internal m_token;
    IDebtManager internal m_debt_manager;
    IRevenuesManager internal m_revenues_manager;
    IStakesManager internal m_stakes_manager;
    IProjectCatalog internal m_project_catalog;
    IGovernanceToken internal m_governance_token;
    INFTOwnership internal m_nft_ownership;
    INFT_TransactionPool internal m_nft_transaction_pool;

    Counters.Counter m_current_nft_id;
    mapping (uint256 => NFTStructs.NFT) m_nfts;
    mapping (uint256 => IterableSet.Set) m_projects;
    mapping (uint256 => IterableSet.Set) m_collections;
    mapping (uint256 => uint256) m_nft_to_projects;
    mapping (uint256 => uint256) m_nft_to_collection;

    //Events
    event NativeTokenSet(address token);
    event DebtManagerSet(address debt_manager);
    event RevenuesManagerSet(address revenues_manager);
    event StakesManagerSet(address stakes_manager);
    event ProjectCatalogSet(address project_catalog);
    event GovernanceTokenSet(address governance_token);
    event NFTOwnershipSet(address nft_ownership);
    event CompanyAccountSet(address company_account);

    event NFT_TransactionPoolSet(address nft_tx_pool);
    event NFTMinted (address by, uint256 indexed project_id, uint256 indexed collection_id, uint256 indexed nft_id, string nft_type);
    event NFTTransferred (address from, address to, uint256 indexed project_id, uint256 indexed collection_id, uint256 indexed nft_id, string nft_type);
    event NFTBurned (address by, uint256 indexed project_id, uint256 indexed collection_id, uint256 indexed nft_id, string nft_type);

    event TransactionApproved (address indexed from, address indexed to, uint256 indexed nft_id, uint256 shares, uint256 price, uint256 tx_id, string payment);
    event TransactionCancelled (address indexed from, address indexed to, uint256 indexed nft_id, uint256 shares, uint256 price, uint256 tx_id);
    event TransactionImplemented (address indexed from, address indexed to, uint256 indexed nft_id, uint256 shares, uint256 price, uint256 tx_id);
}

contract ExternalNFTCatalogStorage is NFTCatalogStorage_SpecificStorage, EternalStorage {
}
