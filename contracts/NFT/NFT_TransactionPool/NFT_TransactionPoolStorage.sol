//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../../Libs/EternalStorage.sol";
import "../../Libs/ProxyStorage.sol";
import "../../Libs/IterableSet.sol";

import "../NFTCatalog/INFTCatalog.sol";
import "../NFTOwnership/INFTOwnership.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT_TransactionPoolStorage_SpecificStorage is ProxyStorage {

    uint256 internal constant k_TX_FEE_BASE = 10000; //in PIPS

    Counters.Counter m_current_tx_id;
    mapping (uint256 => NFTStructs.Transaction) m_transactions;
    //just one active tx per nft at a time
    mapping (address => mapping (uint256 => uint256)) m_tx_pool;
    mapping (NFTStructs.NftType => uint256) m_transaction_fee;
    mapping (address => IterableSet.Set) m_address_to_txs;

    INFTCatalog m_nft_catalog;
    INFTOwnership internal m_nft_ownership;

    //Events
    event NFTCatalogSet(address nft_catalog);
    event NFTOwnershipSet(address nft_ownership);
}

contract ExternalNFT_TransactionPoolStorage is NFT_TransactionPoolStorage_SpecificStorage, EternalStorage {
}
