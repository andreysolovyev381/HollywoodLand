//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./NFTOwnershipStorage.sol";
import "../Libs/NFTStructs.sol";
import "../../Libs/ExternalFuncs.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";


contract NFTOwnershipImplementation is ExternalNFTOwnershipStorage, AccessControl, Initializable {
    using SafeMath for uint256;

    modifier isSetupOk() {
        require(
            address(m_nft_catalog) != address(0) &&
            address(m_nft_transaction_pool) != address(0) &&
            address(m_governance_token) != address(0) &&
            address(m_project_catalog) != address(0) &&
            address(m_debt_manager) != address(0) &&
            address(m_revenues_manager) != address(0) &&
            address(m_stakes_manager) != address(0)
        , "Setup is not ok NFTO");
        _;
    }
    modifier isSystemCall() {
        require(
            msg.sender == address(m_nft_catalog)
//            || msg.sender == address(m_nft_transaction_pool)
//            || msg.sender == address(m_project_catalog)
        , "Not a system call");
        _;
    }
    constructor() {
        m_name = "Project Catalog Implementation, not for usage";
        m_symbol = "DONT_USE";
    }
    function initialize(string memory version) public initializer onlyRole(MINTER_ROLE) {
        m_implementation_version.push(version);
    }
    function name() public view returns (string memory) {
        return m_name;
    }
    function symbol() public view returns (string memory) {
        return m_symbol;
    }
    //todo: DRY
    function getCurrentVersion () public view returns (string memory) {
        return m_implementation_version[m_implementation_version.length - 1];
    }
    //todo: DRY
    function getVersionHistory () public view returns (string[] memory) {
        return m_implementation_version;
    }

    function setNFTCatalog (address nft_catalog) public onlyRole(MINTER_ROLE) {
        require (nft_catalog != address(0), "no address");
        m_nft_catalog = INFTCatalog(nft_catalog);
        emit NFTCatalogSet(nft_catalog);
    }
    function setNFT_TransactionPool (address nft_tx_pool) public onlyRole(MINTER_ROLE) {
        require (nft_tx_pool != address(0), "no address");
        m_nft_transaction_pool = INFT_TransactionPool(nft_tx_pool);
        emit NFT_TransactionPoolSet(nft_tx_pool);
    }
    function setProjectCatalog (address project_catalog) public onlyRole(MINTER_ROLE) {
        require (project_catalog != address(0), "no address");
        m_project_catalog = IProjectCatalog(project_catalog);
        emit ProjectCatalogSet(project_catalog);
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
    function setGovernanceToken (address governance_token) public onlyRole(MINTER_ROLE) {
        require (governance_token != address(0), "no address");
        m_governance_token = IGovernanceToken(governance_token);
        emit GovernanceTokenSet(governance_token);
    }

    function startOwnership (address new_owner, address by, uint256 nft_id, uint256 shares) public isSetupOk isSystemCall {
        //todo: alternative way is to introduce default operators mechanism, but that would provide an excessive access to this smart contract
        bool isNoOperatorCheck = (
            by == address(m_project_catalog) ||
            by == address(m_debt_manager) ||
            by == address(m_revenues_manager) ||
            by == address(m_stakes_manager)
        );
        if (!isNoOperatorCheck) {
            require(isApprovedOperator(new_owner, by), "not approved operator");
        }
        require(m_nft_catalog.isNoNft(nft_id), "NFT id is already in use");
        require(!m_nft_ownership[nft_id]._initialized, "NFT ownership is already initialized");

        m_nft_ownership[nft_id]._initialized = true;
        m_nft_ownership[nft_id]._total_owned_shares = shares;
        m_nft_ownership[nft_id]._shares_owned[new_owner] = shares;

        addOwner(new_owner, nft_id);
    }
    function approveTransaction(address by, uint256 tx_id) public isSetupOk isSystemCall {
        NFTStructs.Transaction memory txn = m_nft_transaction_pool.getTransaction(tx_id);
        require(isOwner(txn._from, txn._nft_id), "owner doesn't have this NFT at approveTransaction()");
        if (by != address(m_governance_token)){
            require(
                isApprovedOperator(txn._from, by)
                || isApprovedOperator(txn._from, by, txn._nft_id)
                , "not approved by NFT Ownership at approveTransaction()");
        }
        require(txn._status == NFTStructs.TransactionStatus.Created, "reentry is not allowed");

        //extra check, no more than one transaction per address per NFT is allowed
        uint256 shares_available =
            m_nft_ownership[txn._nft_id]._shares_owned[txn._from].sub(m_nft_ownership[txn._nft_id]._shares_blocked[txn._from]._txn_volume);
        require(shares_available >= txn._shares, "not enough shares");

        m_nft_ownership[txn._nft_id]._shares_blocked[txn._from]._txn_id = tx_id;
        m_nft_ownership[txn._nft_id]._shares_blocked[txn._from]._txn_volume =
            m_nft_ownership[txn._nft_id]._shares_blocked[txn._from]._txn_volume.add(txn._shares);
        emit ApprovedForTransaction(txn._from, txn._to, txn._nft_id, txn._shares);
    }
    function cancelTransaction(address by, uint256 tx_id) public isSetupOk isSystemCall {
        NFTStructs.Transaction memory txn = m_nft_transaction_pool.getTransaction(tx_id);
        require(isOwner(txn._from, txn._nft_id), "owner doesn't have this NFT");
        require(isApprovedOperator(txn._from, by) || isApprovedOperator(txn._from, by, txn._nft_id), "not approved");
        require(tx_id == m_nft_ownership[txn._nft_id]._shares_blocked[txn._from]._txn_id,
            ExternalFuncs.getErrorMsg(
                "not an ongoing transaction",
                m_nft_ownership[txn._nft_id]._shares_blocked[txn._from]._txn_id)
        );
        uint256 shares_blocked = m_nft_ownership[txn._nft_id]._shares_blocked[txn._from]._txn_volume;
        require(txn._shares == shares_blocked, "not an ongoing transaction");
        require(txn._status == NFTStructs.TransactionStatus.Approved, "reentry is not allowed");

        delete m_nft_ownership[txn._nft_id]._shares_blocked[txn._from];
        emit CancelledFromTransaction(txn._from, txn._to, txn._nft_id, txn._shares);
    }
    function transferOwnership (address by, uint256 tx_id) public isSetupOk isSystemCall {
        NFTStructs.Transaction memory txn = m_nft_transaction_pool.getTransaction(tx_id);
        require(isOwner(txn._from, txn._nft_id), "owner doesn't have this NFT at transferOwnership()");
        //txn m_implementation can be called by a person who pays for that only
        if (by != address(m_governance_token)){
            require(
                isApprovedOperator(txn._to, by) ||
                isApprovedOperator(txn._to, by, txn._nft_id)
                , "not approved by NFT Ownership at transferOwnership()");
        }
        require(tx_id == m_nft_ownership[txn._nft_id]._shares_blocked[txn._from]._txn_id, "not an ongoing transaction");
        uint256 shares_blocked = m_nft_ownership[txn._nft_id]._shares_blocked[txn._from]._txn_volume;
        require(txn._shares == shares_blocked, "not an ongoing transaction");
        require(txn._status == NFTStructs.TransactionStatus.Approved, "reentry is not allowed");

        delete m_nft_ownership[txn._nft_id]._shares_blocked[txn._from];

        bool add_owner = (m_nft_ownership[txn._nft_id]._shares_owned[txn._to] == 0);
        m_nft_ownership[txn._nft_id]._shares_owned[txn._from] =
            m_nft_ownership[txn._nft_id]._shares_owned[txn._from].sub(txn._shares);
        m_nft_ownership[txn._nft_id]._shares_owned[txn._to] =
            m_nft_ownership[txn._nft_id]._shares_owned[txn._to].add(txn._shares);
        bool remove_owner = (m_nft_ownership[txn._nft_id]._shares_owned[txn._from] == 0);

        if(add_owner) {
            addOwner(txn._to, txn._nft_id);
        }
        if(remove_owner) {
            removeOwner(txn._from, txn._nft_id);
        }

        emit Transferred (txn._from, txn._to, txn._nft_id, txn._shares);
    }
    function burnOwnership (address for_owner, address by, uint256 nft_id) public isSetupOk isSystemCall returns (bool) {
        require(isOwner(for_owner, nft_id), "owner doesn't have this NFT");
        //todo: alternative way is to introduce default operators mechanism, but that would provide an excessive access to this smart contract
        bool isNoOperatorCheck = (
        by == address(m_project_catalog) ||
        by == address(m_debt_manager) ||
        by == address(m_revenues_manager) ||
        by == address(m_stakes_manager)
        );
        if (!isNoOperatorCheck) {
            require(isApprovedOperator(for_owner, by) || isApprovedOperator(for_owner, by, nft_id), "not approved");
        }

        uint256 shares_to_burn = m_nft_ownership[nft_id]._shares_owned[for_owner];
        removeOwner(for_owner, nft_id);
        m_nft_ownership[nft_id]._total_owned_shares = m_nft_ownership[nft_id]._total_owned_shares.sub(shares_to_burn);
        uint256 shares_left = m_nft_ownership[nft_id]._total_owned_shares;
        if (shares_left == 0) {
            m_nft_ownership[nft_id]._burned = true;
        }
        emit Burned(for_owner, nft_id, shares_to_burn);
        return isBurned(nft_id);
    }

    function getTotalSharesForNFT (uint256 nft_id) public view isSetupOk returns (uint256){
        require(m_nft_catalog.isOkNft(nft_id), "no NFT");
        require(checkOwnershipActive(nft_id), "NFT ownership is not active");
        return m_nft_ownership[nft_id]._total_owned_shares;
    }
    function getSharesTotal (address owner, uint256 nft_id) public view isSetupOk returns (uint256) {
        require(m_nft_catalog.isOkNft(nft_id), "no NFT");
        require(checkOwnershipActive(nft_id), "NFT ownership is not active");
        return m_nft_ownership[nft_id]._shares_owned[owner];
    }
    function getSharesAvailable (address owner, uint256 nft_id) public view isSetupOk returns (uint256) {
        require(m_nft_catalog.isOkNft(nft_id), "no NFT");
        require(checkOwnershipActive(nft_id), "NFT ownership is not active");
        uint256 shares_available = m_nft_ownership[nft_id]._shares_owned[owner].sub(m_nft_ownership[nft_id]._shares_blocked[owner]._txn_volume);
        return shares_available;
    }
    function getSharesBlocked (address owner, uint256 nft_id) public view isSetupOk returns (uint256) {
        require(m_nft_catalog.isOkNft(nft_id), "no NFT");
        require(checkOwnershipActive(nft_id), "NFT ownership is not active");
        uint256 shares_blocked = m_nft_ownership[nft_id]._shares_blocked[owner]._txn_volume;
        return shares_blocked;
    }
    function getOwnershipForAddress (address owner) public view returns (uint256[] memory) {
        require (address(owner)!= address(0), "Address should be valid");
        require(!IterableSet.empty(m_owner_to_nfts[owner]), "no NFTs owned");
        return m_owner_to_nfts[owner].keys;
    }
    function getOwnershipForNFT (uint256 nft_id) public view isSetupOk returns (address[] memory) {
        require(m_nft_catalog.isOkNft(nft_id), "no NFT");
        require(checkOwnershipActive(nft_id), "NFT ownership is not active");
        return m_nft_ownership[nft_id]._owners;
    }
    function getOwnersCount (uint256 nft_id) public view isSetupOk returns (uint256) {
        require(m_nft_catalog.isOkNft(nft_id), "no NFT");
        require(checkOwnershipActive(nft_id), "NFT ownership is not active");
        return m_nft_ownership[nft_id]._owners.length;
    }
    function isNotCreated (uint256 nft_id) public view returns (bool) {
        return !m_nft_ownership[nft_id]._initialized && !m_nft_ownership[nft_id]._burned;
    }
    function isActive (uint256 nft_id) public view returns (bool) {
        return m_nft_ownership[nft_id]._initialized && !m_nft_ownership[nft_id]._burned;
    }
    function isBurned (uint256 nft_id) public view returns (bool) {
        return m_nft_ownership[nft_id]._initialized && m_nft_ownership[nft_id]._burned;
    }

    function isOwner (address owner, uint256 nft_id) public view isSetupOk returns (bool) {
        require(m_nft_catalog.isOkNft(nft_id), "no NFT");
        require(checkOwnershipActive(nft_id), "NFT ownership is not active");
        require(owner != address(0), "Address should be valid");
        return m_nft_ownership[nft_id]._owner_inserted[owner];
    }
    function isApprovedOperator(address owner, address operator, uint256 nft_id) public view isSetupOk returns (bool) {
        require(m_nft_catalog.isOkNft(nft_id), "no NFT");
        require(checkOwnershipActive(nft_id), "NFT ownership is not active");
        require(owner != address(0) && operator != address(0), "Addresses should be valid");

        return
        operator == address(this) ||
        owner == operator ||
        m_approvals_for_nft_operators[owner][nft_id]._operator_inserted[operator];
    }
    function isApprovedOperator(address owner, address operator) public view returns (bool) {
        require(owner != address(0) && operator != address(0), "Addresses should be valid");
        return
        operator == address(this) ||
        owner == operator ||
        m_approvals_for_global_operators[owner][operator];
    }
    function setOperator(address owner, address operator, bool approved) public {
        require(owner != operator, "Trying approve to caller");
        require(owner != address(0) && operator != address(0), "incorrect addresses");
        require(owner == msg.sender, "Only owner can set operator");
        m_approvals_for_global_operators[owner][operator] = approved;

        emit ApprovedOperatorForAll(owner, operator, approved); // approved - true : false
    }
    function approveOperatorForNFT(address to, uint256 nft_id) public {
        require(isOwner(msg.sender, nft_id), "only an owner can approve operator");

        m_approvals_for_nft_operators[msg.sender][nft_id]._operator_inserted[to] = true;
        m_approvals_for_nft_operators[msg.sender][nft_id]._operators.push(to);
        m_approvals_for_nft_operators[msg.sender][nft_id]._index_of_operator[to] =
        m_approvals_for_nft_operators[msg.sender][nft_id]._operators.length - 1;

        emit ApprovedOperatorForNFT(msg.sender, to, nft_id);
    }
    //todo: DRY
    function revokeOperatorForNFT(address to, uint256 nft_id) public {
        require(isOwner(msg.sender, nft_id), "only owner can revoke operator");
        require(m_approvals_for_nft_operators[msg.sender][nft_id]._operator_inserted[to], "not an operator for this NFT");

        uint256 index = m_approvals_for_nft_operators[msg.sender][nft_id]._index_of_operator[to];
        uint256 last_index = m_approvals_for_nft_operators[msg.sender][nft_id]._operators.length - 1;
        address last_elem = m_approvals_for_nft_operators[msg.sender][nft_id]._operators[last_index];

        m_approvals_for_nft_operators[msg.sender][nft_id]._index_of_operator[last_elem] = index;
        m_approvals_for_nft_operators[msg.sender][nft_id]._operators[index] = last_elem;

        m_approvals_for_nft_operators[msg.sender][nft_id]._operators.pop();
        m_approvals_for_nft_operators[msg.sender][nft_id]._operator_inserted[to] = false;
        delete m_approvals_for_nft_operators[msg.sender][nft_id]._index_of_operator[to];

        emit RevokedOperatorForNFT(msg.sender, to, nft_id);
    }


    function addOwner (address owner, uint256 nft_id) private {
        if (!m_nft_ownership[nft_id]._owner_inserted[owner]) {
            m_nft_ownership[nft_id]._index_of_owner[owner] = m_nft_ownership[nft_id]._owners.length;
            m_nft_ownership[nft_id]._owners.push(owner);
            m_nft_ownership[nft_id]._owner_inserted[owner] = true;

            IterableSet.insert(m_owner_to_nfts[owner], nft_id);
        }
    }
    //todo: DRY
    function removeOwner (address owner, uint256 nft_id) private {
        if (m_nft_ownership[nft_id]._owner_inserted[owner]) {

            uint256 index = m_nft_ownership[nft_id]._index_of_owner[owner];
            uint256 last_index = m_nft_ownership[nft_id]._owners.length - 1;
            address last_elem = m_nft_ownership[nft_id]._owners[last_index];

            m_nft_ownership[nft_id]._index_of_owner[last_elem] = index;
            m_nft_ownership[nft_id]._owners[index] = last_elem;

            m_nft_ownership[nft_id]._owners.pop();
            m_nft_ownership[nft_id]._owner_inserted[owner] = false;
            delete m_nft_ownership[nft_id]._index_of_owner[owner];
            delete m_nft_ownership[nft_id]._shares_owned[owner];

            delete m_approvals_for_nft_operators[owner][nft_id];

            IterableSet.erase(m_owner_to_nfts[owner], nft_id);
        }
    }

    function checkOwnershipActive (uint256 nft_id) private view returns (bool) {
        return m_nft_ownership[nft_id]._initialized && !m_nft_ownership[nft_id]._burned;
    }
}
