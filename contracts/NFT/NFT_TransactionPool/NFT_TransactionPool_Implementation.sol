//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./NFT_TransactionPoolStorage.sol";
import "../Libs/NFTStructs.sol";
import "../Libs/NFT_Helpers.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";


contract NFT_TransactionPool_Implementation is ExternalNFT_TransactionPoolStorage, AccessControl, Initializable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    modifier isSetupOk() {
        require(
            address(m_nft_catalog) != address(0) &&
            address(m_nft_ownership) != address(0)
        , "Setup is not ok NFTTP");
        _;
    }
    modifier isSystemCall() {
        require(msg.sender == address(m_nft_catalog) ||
            msg.sender == address(m_nft_ownership)
        , "Not a system call");
        _;
    }
    constructor() {
        m_name = "Part of NFT Catalog Implementation, not for usage";
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
        require (nft_catalog != address(0), "Address should be valid");
        m_nft_catalog = INFTCatalog(nft_catalog);
        emit NFTCatalogSet(nft_catalog);
    }

    function setNFTOwnership (address nft_ownership) public onlyRole(MINTER_ROLE) {
        require (nft_ownership != address(0), "Address should be valid");
        m_nft_ownership = INFTOwnership(nft_ownership);
        emit NFTOwnershipSet(nft_ownership);
    }

    function makeTransaction (
        address from,
        address to,
        uint256 nft_id,
        uint256 shares,
        uint256 price,
        bool is_ether_payment
    ) public isSystemCall returns (uint256) {
        require (m_tx_pool[from][nft_id] == 0, "Can't have more than one transaction for same NFT at a time");

        NFTStructs.Transaction memory txn;
        txn._initialized = true;
        txn._from = from;
        txn._to = to;

        txn._nft_id = nft_id;
        txn._shares = shares;
        txn._price = price;
        txn._fee = getTransactionFee(nft_id);
        txn._status = NFTStructs.TransactionStatus.Created;
        txn._is_ether_payment = is_ether_payment;

        uint256 tx_id = getNextTransactionID();
        m_transactions[tx_id] = txn;
        m_tx_pool[from][nft_id] = tx_id;
        IterableSet.insert(m_address_to_txs[from], tx_id);
        IterableSet.insert(m_address_to_txs[to], tx_id);

        return tx_id;
    }
    function getNextTransactionID() private returns (uint256) {
        Counters.increment(m_current_tx_id);
        return Counters.current(m_current_tx_id);
    }
    function deleteTransaction (uint256 tx_id, NFTStructs.TransactionStatus new_status) public isSystemCall {
        require (checkTransactionActive(tx_id), "Transaction is not active");

        NFTStructs.Transaction memory txn = m_transactions[tx_id];

        m_transactions[tx_id]._closed = true;
        m_transactions[tx_id]._status = new_status;
        m_tx_pool[txn._from][txn._nft_id] = 0;
        IterableSet.erase(m_address_to_txs[txn._from], tx_id);
        IterableSet.erase(m_address_to_txs[txn._to], tx_id);
    }
    function setTransactionStatus (uint256 tx_id, NFTStructs.TransactionStatus new_status) public isSystemCall {
        require (checkTransactionActive(tx_id), "Transaction is not active");
        m_transactions[tx_id]._status = new_status;
    }

    function getTransaction (uint256 tx_id) public view returns (NFTStructs.Transaction memory) {
        require (checkTransactionActive(tx_id), "Transaction is not active");
        return m_transactions[tx_id];
    }
    function getOngoingTransactions(address addr) public view returns (uint256[] memory) {
        return m_address_to_txs[addr].keys;
    }

    function setTransactionFee(string memory nft_type, uint256 fee) public onlyRole(MINTER_ROLE) {
        NFTStructs.NftType _nft_type = NFT_Helpers.getNftTypefromStr(nft_type);
        m_transaction_fee[_nft_type] = fee;
    }
    function getTransactionFee(uint256 nft_id) public view isSetupOk returns (uint256) {
        NFTStructs.NFT memory nft = m_nft_catalog.getNFT(nft_id);
        return m_transaction_fee[nft._type];
    }
    function getTransactionFeeTX(uint256 tx_id) public view isSetupOk returns (uint256) {
        NFTStructs.Transaction memory txn = m_transactions[tx_id];
        NFTStructs.NFT memory nft = m_nft_catalog.getNFT(txn._nft_id);
        uint256 tx_fee = m_transaction_fee[nft._type];
        uint256 fee_to_keep = 0;
        if (tx_fee != 0) {
            fee_to_keep = txn._price.mul(tx_fee).div(k_TX_FEE_BASE);
        }
        return fee_to_keep;
    }

    function checkTransactionActive(uint256 tx_id) public view returns (bool) {
        return m_transactions[tx_id]._initialized && !m_transactions[tx_id]._closed;
    }
    function checkTransactionCreationAllowed(address from, uint256 nft_id) public view returns (bool) {
        return m_tx_pool[from][nft_id] == 0;
    }

}
