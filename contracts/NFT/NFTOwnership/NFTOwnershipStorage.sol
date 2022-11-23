//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../../Libs/EternalStorage.sol";
import "../../Libs/ProxyStorage.sol";
import "../../Libs/IterableSet.sol";

import "../../ProjectCatalog/IProjectCatalog.sol";
import "../../Governance/GovernanceToken/IGovernanceToken_.sol";
import "../NFTCatalog/INFTCatalog.sol";
import "../NFT_TransactionPool/INFT_TransactionPool.sol";
import "../../Finance/DebtManager/IDebtManager.sol";
import "../../Finance/StakesManager/IStakesManager.sol";
import "../../Finance/RevenuesManager/IRevenuesManager.sol";


contract NFTOwnershipStorage_SpecificStorage is ProxyStorage {

    struct BlockedForTransactions {
        uint256 _txn_id;
        uint256 _txn_volume;
    }

    struct Ownership {
        bool _initialized;
        bool _burned;
        uint256 _total_owned_shares;

        mapping (address => uint256) _shares_owned;
        //no more than one transaction per address per nft, otherwise it may result in a double spend
        mapping (address => BlockedForTransactions) _shares_blocked;

        mapping (address => bool) _owner_inserted;
        mapping (address => uint256) _index_of_owner;
        address[] _owners;
    }

    struct ApprovedOperators {
        mapping (address => bool) _operator_inserted;
        mapping (address => uint256) _index_of_operator;
        address[] _operators;
    }

    //Ownership
    mapping (uint256 => Ownership) internal m_nft_ownership;
    mapping (address => IterableSet.Set) internal m_owner_to_nfts;

    //Operators
    mapping (address => mapping(uint256 => ApprovedOperators)) internal m_approvals_for_nft_operators;
    mapping(address => mapping(address => bool)) internal m_approvals_for_global_operators;

    IProjectCatalog internal m_project_catalog;
    IGovernanceToken internal m_governance_token;
    INFTCatalog internal m_nft_catalog;
    INFT_TransactionPool internal m_nft_transaction_pool;
    IDebtManager internal m_debt_manager;
    IRevenuesManager internal m_revenues_manager;
    IStakesManager internal m_stakes_manager;

    //Events
    event NFTCatalogSet(address nft_catalog);
    event NFT_TransactionPoolSet(address nft_tx_pool);
    event ProjectCatalogSet(address project_catalog);
    event DebtManagerSet(address debt_manager);
    event RevenuesManagerSet(address revenues_manager);
    event StakesManagerSet(address stakes_manager);
    event GovernanceTokenSet(address governance_token);

    event ApprovedForTransaction(address indexed owner, address indexed to, uint256 nft_id, uint256 shares);
    event CancelledFromTransaction(address indexed owner, address indexed to, uint256 nft_id, uint256 shares);
    event Transferred (address indexed from, address indexed to, uint256 indexed nft_id, uint256 share);
    event Burned (address indexed owner, uint256 indexed nft_id, uint256 shares);
    event ApprovedOperatorForAll(address indexed owner, address indexed operator, bool approved);
    event ApprovedOperatorForNFT(address indexed owner, address indexed approved, uint256 indexed nft_id);
    event RevokedOperatorForNFT(address indexed owner, address indexed approved, uint256 indexed nft_id);
}

contract ExternalNFTOwnershipStorage is NFTOwnershipStorage_SpecificStorage, EternalStorage {
}
