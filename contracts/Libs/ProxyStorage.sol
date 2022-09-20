//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
import "../Libs/IERC777Wrapper.sol";
import "../Finance/DebtManager/IDebtManager.sol";
import "../Finance/StakesManager/IStakesManager.sol";
import "../Finance/RevenuesManager/IRevenuesManager.sol";
import "../ProjectCatalog/IProjectCatalog.sol";
import "../Governance/GovernanceToken/IGovernanceToken_.sol";
import "../NFT/NFTOwnership/INFTOwnership.sol";
import "../NFT/NFT_TransactionPool/INFT_TransactionPool.sol";
*/

contract ProxyStorage {
    bytes32 internal constant MINTER_ROLE = keccak256("MINTER_ROLE");
    string internal m_name;
    string internal m_symbol;
    string[] internal m_implementation_version;

/*
    IERC777Wrapper internal m_token;
    IDebtManager internal m_debt_manager;
    IRevenuesManager internal m_revenues_manager;
    IStakesManager internal m_stakes_manager;
    IProjectCatalog internal m_project_catalog;
    IGovernanceToken internal m_governance_token;
    INFTOwnership internal m_nft_ownership;
    INFT_TransactionPool internal m_nft_transaction_pool;

    event ERC777Set(address token);
    event DebtManagerSet(address debt_manager);
    event RevenuesManagerSet(address revenues_manager);
    event StakesManagerSet(address stakes_manager);
    event ProjectCatalogSet(address project_catalog);
    event GovernanceTokenSet(address governance_token);
    event NFTOwnershipSet(address nft_ownership);
    event NFT_TransactionPoolSet(address nft_tx_pool);
*/
}
