//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProxyStorage.sol";

contract ProxyImplementation is ProxyStorage {
    /*
    modifier isSetupOk() {
        require(
            address(m_token) != address(0) &&
            address(m_debt_manager) != address(0) &&
            address(m_stakes_manager) != address(0) &&
            address(m_project_catalog) != address(0) &&
            address(m_governance_token) != address(0) &&
            address(m_nft_ownership) != address(0) &&
            address(m_nft_transaction_pool) != address(0)
        , "Setup is not ok");
        _;
    }
    modifier isSystemCall() {

        require(
            msg.sender == address(m_token) ||
            msg.sender == address(m_debt_manager) ||
            msg.sender == address(m_stakes_manager) ||
            msg.sender == address(m_project_catalog) ||
            msg.sender == address(m_governance_token) ||
            msg.sender == address(m_nft_ownership) ||
            msg.sender == address(m_nft_transaction_pool)
        , "Not a system call");
        _;
    }

    constructor()
    {
        m_name = "Implementation Contract, not for usage";
        m_symbol = "DONT_USE";
    }

    function name() public view returns (string memory) {
        return m_name;
    }
    function symbol() public view returns (string memory) {
        return m_symbol;
    }

    function getCurrentVersion () public view returns (string memory) {
        return m_implementation_version[m_implementation_version.length - 1];
    }

    function getVersionHistory () public view returns (string[] memory) {
        return m_implementation_version;
    }

    function setERC777 (address token) public onlyRole(MINTER_ROLE) {
        require (token != address(0), "no address");
        m_token = IERC777Wrapper(token);
        emit ERC777Set(token);
    }
    function setDebtManager (address debt_manager) public onlyRole(MINTER_ROLE) {
        require (debt_manager != address(0), "no address");
        m_debt_manager = IDebtManager(debt_manager);
        emit DebtManagerSet(debt_manager);
    }
    function setRevenuesManager (address revenues_manager) public onlyRole(MINTER_ROLE) {
        require (revenues_manager != address(0), "no address");
        m_revenues_manager = IRevenuesManager(revenues_manager);
        emit RevenuesManagerSet(revenues_manager);
    }
    function setStakesManager (address stakes_manager) public onlyRole(MINTER_ROLE) {
        require (stakes_manager != address(0), "no address");
        m_stakes_manager = IStakesManager(stakes_manager);
        emit StakesManagerSet(stakes_manager);
    }
    function setProjectCatalog (address project_catalog) public onlyRole(MINTER_ROLE) {
        require (project_catalog != address(0), "no address");
        m_project_catalog = IProjectCatalog(project_catalog);
        emit ProjectCatalogSet(project_catalog);
    }
    function setGovernanceToken (address governance_token) public onlyRole(MINTER_ROLE) {
        require (governance_token != address(0), "no address");
        m_governance_token = IGovernanceToken(governance_token);
        emit GovernanceTokenSet(governance_token);
    }
    function setNFTOwnership (address nft_ownership) public onlyRole(MINTER_ROLE) {
        require (nft_ownership != address(0), "no address");
        m_nft_ownership = INFTOwnership(nft_ownership);
        emit NFTOwnershipSet(nft_ownership);
    }
    function setNFT_TransactionPool (address nft_tx_pool) public onlyRole(MINTER_ROLE) {
        require (nft_tx_pool != address(0), "no address");
        m_nft_transaction_pool = INFT_TransactionPool(nft_tx_pool);
        emit NFT_TransactionPoolSet(nft_tx_pool);
    }
    */
}
