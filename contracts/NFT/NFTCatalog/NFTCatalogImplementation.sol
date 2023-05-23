//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./NFTCatalogStorage.sol";
import "../Libs/NFT_Helpers.sol";
import "../Libs/NFTStructs.sol";
import "../../Libs/InheritanceHelpers.sol";

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../../Governance/GovernanceToken/GovernanceTokenImplementation.sol";

contract NFTCatalogImplementation is ExternalNFTCatalogStorage, ControlBlock {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    modifier isSetupOk() {
        require(
            address(m_token) != address(0) &&
            address(m_stakes_manager) != address(0) &&
            address(m_debt_manager) != address(0) &&
            address(m_project_catalog) != address(0) &&
            address(m_governance_token) != address(0) &&
            address(m_nft_ownership) != address(0) &&
            address(m_nft_transaction_pool) != address(0) &&
            m_company_account != address(0)

        , "Setup is not ok NFTC");
        _;
    }
    modifier isSystemCall() {
        require(
//            msg.sender == address(m_project_catalog) ||
//            msg.sender == address(m_stakes_manager) ||
            msg.sender == address(m_debt_manager) ||
//            msg.sender == address(m_governance_token) ||
            msg.sender == address(m_nft_ownership)
//            || msg.sender == address(m_nft_transaction_pool)
        , "Not a system call");
        _;
    }

    constructor()
    {
        m_name = "NFT Catalog Implementation, not for usage";
        m_symbol = "DONT_USE";
    }
    function initialize(string memory version, uint8 version_num) public reinitializer(version_num) onlyRole(MINTER_ROLE) {
        m_implementation_version.push(version);
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

    function setNativeToken (address token) public onlyRole(MINTER_ROLE) {
        require (token != address(0), "no address");
        m_token = IERC777Wrapper(token);
        emit NativeTokenSet(token);
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
    function setCompanyAccount (address company_account) public onlyRole(MINTER_ROLE) {
        require (company_account != address(0), "Address should be valid");
        m_company_account = company_account;
        emit CompanyAccountSet(m_company_account);
    }

    function mint (
        address new_owner,
        string memory _type,
        string memory uri,
        uint256 collection_id,
        uint256 project_id,
        uint256 price,
        uint256 shares
    ) public isSetupOk returns (uint256){
        require (new_owner != address(0), "Address should be valid");
        require (shares != 0, "Shares can't be 0");

        NFTStructs.NftType nft_type = NFT_Helpers.getNftTypefromStr(_type);

        // A guard to use respective contracts for Project management and Finance management
        nftTypeGuard(msg.sender, nft_type);

        if (collection_id != 0) {
            require (nft_type != NFTStructs.NftType.Collection, "Collection can't be minted for Collection");
            require (m_nfts[collection_id]._type == NFTStructs.NftType.Collection && isOkNft(collection_id), "Non-existing Collection, zero to skip");
        }
        if (project_id != 0) {
            //extra guard, as it is not allowed to mint Project here
            require (nft_type != NFTStructs.NftType.Project, "Project can't be minted for Project");
            require (m_nfts[project_id]._type == NFTStructs.NftType.Project && isOkNft(project_id), "Non-existing Project, zero to skip");
        }
        if (project_id != 0 && collection_id != 0) {
            require (m_nft_to_projects[collection_id] == project_id, "Collection is not in the Project");
        }

        //no need in this extra guard, both DM and SM checks NFT[nft_id] exists and it is a Project
//        if (msg.sender == address(m_debt_manager) || msg.sender == address(m_stakes_manager)) {
//            require (
//                project_id != 0 &&
//                m_nfts[project_id]._type == NFTStructs.NftType.Project &&
//                isOkNft(project_id)
//                , "no Finance for no Project");
//        }
        //added as Audit Finding #4
        if (nft_type == NFTStructs.NftType.ProjectArt) {
            require (project_id != 0 && m_nft_ownership.isOwner(msg.sender, project_id), "Only project owner can mint Project Art");
        }

        //set 100% ownership for minter, check operatorship
        uint256 nft_id = getNextNftID();
        m_nft_ownership.startOwnership(new_owner, msg.sender, nft_id, shares);

        NFTStructs.NFT memory nft;
        nft._minted = true;
        nft._uri = uri;
        nft._type = nft_type;
        m_nfts[nft_id] = nft;
        nft._last_price = nft_type == NFTStructs.NftType.Stake ? updatePriceOfNFT(nft_id, shares, price) : 0;

        //regular NFT
        if ((nft._type != NFTStructs.NftType.Project && nft._type != NFTStructs.NftType.Collection)){
            if (collection_id != 0) {
                IterableSet.insert(m_collections[collection_id], nft_id);
                m_nft_to_collection[nft_id] = collection_id;
            }
            if (project_id != 0) {
                IterableSet.insert(m_projects[project_id], nft_id);
                m_nft_to_projects[nft_id] = project_id;
            }
        }

        //Collection
        if ((nft._type == NFTStructs.NftType.Collection && project_id != 0)) {
            IterableSet.insert(m_projects[project_id], nft_id);
            m_nft_to_projects[nft_id] = project_id;
        }

        emit NFTMinted(new_owner, project_id, collection_id, nft_id, _type);
        return nft_id;
    }
    function burn (address from_owner, uint256 nft_id) public isSetupOk {
        require (from_owner != address(0), "Address should be valid");

        require (isOkNft(nft_id), "no NFT");
        NFTStructs.NFT storage nft = m_nfts[nft_id];
        NFTStructs.NftType nft_type = nft._type;

        // A guard to use respective contracts for Project management and Finance management
        nftTypeGuard(msg.sender, nft_type);

        bool burned_completely = m_nft_ownership.burnOwnership(from_owner, msg.sender, nft_id);

        if (burned_completely){
            //regular NFT
            if (nft._type != NFTStructs.NftType.Project && nft._type != NFTStructs.NftType.Collection) {
                uint256 collection_id = m_nft_to_collection[nft_id];
                if (IterableSet.inserted(m_collections[collection_id], nft_id)) {
                    IterableSet.erase(m_collections[collection_id], nft_id);
                }
                delete m_nft_to_collection[nft_id];
                uint256 project_id = m_nft_to_projects[nft_id];
                if (IterableSet.inserted(m_projects[project_id], nft_id)) {
                    IterableSet.erase(m_projects[project_id], nft_id);
                }
                delete m_nft_to_projects[nft_id];
            }

            //Removing a Collection
            else if (nft._type == NFTStructs.NftType.Collection && !IterableSet.empty(m_collections[nft_id])) {
                IterableSet.Set storage collection = m_collections[nft_id];
                uint256 idx;
                uint256 count = IterableSet.size(collection);
                uint256 nft_id_to_remove;
                for (; idx != count; ++idx) {
                    nft_id_to_remove = IterableSet.getKeyAtIndex(collection, idx);
                    delete m_nft_to_collection[nft_id_to_remove];
                }
                delete m_collections[nft_id];
            }

            //Removing a Project
            else if (nft._type == NFTStructs.NftType.Project && !IterableSet.empty(m_projects[nft_id])) {
                IterableSet.Set storage project = m_projects[nft_id];
                uint256 idx;
                uint256 count = IterableSet.size(project);
                uint256 nft_id_to_remove;
                for (; idx != count; ++idx) {
                    nft_id_to_remove = IterableSet.getKeyAtIndex(project, idx);
                    delete m_nft_to_projects[nft_id_to_remove];
                }
                delete m_projects[nft_id];
            }

            nft._burned = true;
            emit NFTBurned (from_owner, m_nft_to_projects[nft_id], m_nft_to_collection[nft_id], nft_id, NFT_Helpers.getStrFromNftType(nft_type));
        }
    }

    function approveTransaction(
        address from,
        address to,
        uint256 nft_id,
        uint256 shares,
        uint256 price,
        bool is_ether_payment
    ) public isSetupOk returns (uint256) {
        require (from != address(0) && to != address(0), "Address should be valid");

        require(isOkNft(nft_id), "no NFT");
        require(from != to, "shouldn't approve to yourself");
        require(m_nft_transaction_pool.checkTransactionCreationAllowed(from, nft_id), "can't have more than one of ongoing transactions for NFT");

        uint256 tx_id = m_nft_transaction_pool.makeTransaction(from, to, nft_id, shares, price, is_ether_payment);

        m_nft_ownership.approveTransaction(msg.sender, tx_id);

        m_nft_transaction_pool.setTransactionStatus(tx_id, NFTStructs.TransactionStatus.Approved);

        // last price update is moved to this->implementTransaction as Audit Finding #1

        emit TransactionApproved (from, to, nft_id, shares, price, tx_id, is_ether_payment ? "ether" : "tokens");
        return tx_id;
    }
    function cancelTransaction(uint256 tx_id) public isSetupOk {
        NFTStructs.Transaction memory txn = m_nft_transaction_pool.getTransaction(tx_id);
        m_nft_ownership.cancelTransaction(msg.sender, tx_id);
        m_nft_transaction_pool.deleteTransaction(tx_id, NFTStructs.TransactionStatus.Rejected);
        emit TransactionCancelled (txn._from, txn._to, txn._nft_id, txn._shares, txn._price, tx_id);
    }
    function implementTransaction(uint256 tx_id) public isSetupOk payable {
        NFTStructs.Transaction memory txn = m_nft_transaction_pool.getTransaction(tx_id);
        require (isOkNft(txn._nft_id), "no NFT");

        // depositNFT or withdrawNFT methods of GovernanceTokenImplementation
        // are the callers of this func, therefore
        // changed from txn._to to msg.sender
        bool is_governance_transfer = (msg.sender == address(m_governance_token));
        if (is_governance_transfer) {
            require (txn._price == 0 , "no pay for Governance");
        }

        //updated as Audit Finding #3
        txn._is_ether_payment ?
            require (msg.value == txn._price, "price mismatch") :
            require (m_token.balanceOf(txn._to) >= txn._price, "no balance");

        if (!is_governance_transfer){
            uint256 fee_to_keep = m_nft_transaction_pool.getTransactionFeeTX(tx_id);
            uint256 value = txn._is_ether_payment ? msg.value : txn._price;

            if (fee_to_keep != 0) {
                value = value.sub(fee_to_keep);

                txn._is_ether_payment ?
                    payable(txn._from).transfer(value) :
                    m_token.operatorSend(txn._to, txn._from, value, '', '') ; //will revert in case msg.sender is not an operator for buyer address

                txn._is_ether_payment ?
                    payable(m_company_account).transfer(fee_to_keep) :
                    m_token.operatorSend(txn._to, m_company_account, fee_to_keep, '', '') ; //will revert in case msg.sender is not an operator for buyer address
            } else {
                if (txn._is_ether_payment) {
                    (bool sent, bytes memory data) = txn._from.call{value:  value}("");
                    require(sent, "Failed to send Ether");
                } else {
                    m_token.operatorSend(txn._to, txn._from, value, '', '') ; //will revert in case msg.sender is not an operator for buyer address
                }
            }

            //added as Audit Finding #1
            m_nfts[txn._nft_id]._last_price = updatePriceOfNFT(txn._nft_id, txn._shares, value);
        }

        //should be done for any type of NFT, update of the ownership executed AFTER payment is successfully proceeded
        m_nft_ownership.transferOwnership(msg.sender, tx_id);
        m_nft_transaction_pool.deleteTransaction(tx_id, NFTStructs.TransactionStatus.Completed);

    emit NFTTransferred (txn._from, txn._to, m_nft_to_projects[txn._nft_id], m_nft_to_collection[txn._nft_id], txn._nft_id, NFT_Helpers.getStrFromNftType(m_nfts[txn._nft_id]._type));
        emit TransactionImplemented (txn._from, txn._to, txn._nft_id, txn._shares, txn._price, tx_id);
    }

    function nftTypeGuard(address caller, NFTStructs.NftType nft_type) private view {
        // A guard to use respective contracts for Project management and Funds management
        if (caller != address(m_stakes_manager)){
            require (nft_type != NFTStructs.NftType.Stake, "use Stakes Manager");
        }
        if (caller != address(m_debt_manager)){
            require (nft_type != NFTStructs.NftType.Debt, "use Debt Manager");
        }
        if (caller != address(m_project_catalog)){
            require (nft_type != NFTStructs.NftType.Project, "use Project Catalog");
        }
    }
    function updatePriceOfNFT(uint256 nft_id, uint256 shares, uint256 price) private view isSetupOk returns (uint256) {
        uint256 total_shares = m_nft_ownership.getTotalSharesForNFT(nft_id);

        return
            m_nfts[nft_id]._last_price == 0 ?
            total_shares.mul(price).div(shares) :
            //total price for NFT, 75% of old price plus 25% of new price
            m_nfts[nft_id]._last_price.mul(3).add(total_shares.mul(price).div(shares)).div(4);
    }

    function getNFT (uint256 nft_id) public view returns (NFTStructs.NFT memory) {
        require (isOkNft(nft_id), "no NFT");
        return m_nfts[nft_id];
    }
    function getCollectionOfToken(uint256 nft_id) public view returns (uint256 collection_id) {
        require (isOkNft(nft_id), "no NFT");
        require (m_nft_to_collection[nft_id] != 0, "No collection linked");
        return m_nft_to_collection[nft_id];
    }
    function getProjectOfToken(uint256 nft_id) public view returns (uint256 project_id){
        require (isOkNft(nft_id), "no NFT");
        require (m_nft_to_projects[nft_id] != 0, "No project linked");
        return m_nft_to_projects[nft_id];
    }

    function nftToJson (uint256 nft_id) public view returns (string memory) {
        require (isOkNft(nft_id), "no NFT");
        if (m_nfts[nft_id]._type == NFTStructs.NftType.Project){
            return NFT_Helpers.getProject(m_nfts, m_projects, m_nft_to_collection, nft_id);
        }
        else if (m_nfts[nft_id]._type == NFTStructs.NftType.Collection){
            return NFT_Helpers.getCollection(m_nfts, m_collections, m_nft_to_projects, nft_id);
        }
        else {
            return NFT_Helpers.getNFT(m_nfts, m_nft_to_collection, m_nft_to_projects, nft_id);
        }
    }

    function getNftTypes () public pure returns (string[] memory) {
        return NFT_Helpers.getNftTypes(NFTStructs.NftTypeLength);
    }
    function getNextNftID() private returns (uint256) {
        Counters.increment(m_current_nft_id);
        return Counters.current(m_current_nft_id);
    }
    function isNoNft(uint256 id) public view returns (bool) {
        return !m_nfts[id]._minted && !m_nfts[id]._burned;
    }
    function isOkNft(uint256 id) public view returns (bool) {
        return m_nfts[id]._minted && !m_nfts[id]._burned;
    }
    function isNftBurned(uint256 id) public view returns (bool) {
        return m_nfts[id]._minted && m_nfts[id]._burned;
    }
}
