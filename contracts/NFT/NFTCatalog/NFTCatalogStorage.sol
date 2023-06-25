//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../Libs/NFTStructs.sol";
import "../../Libs/EternalStorage.sol";
import "../../Libs/ProxyStorage.sol";
import "../../Libs/IterableSet.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTCatalogStorage_SpecificStorage is ProxyStorage {

    //Where the tokens are either earned or spent
    address internal m_company_account;


    Counters.Counter m_current_nft_id;
    mapping (uint256 => NFTStructs.NFT) m_nfts;
    mapping (uint256 => IterableSet.Set) m_projects;
    mapping (uint256 => IterableSet.Set) m_collections;
    mapping (uint256 => uint256) m_nft_to_projects;
    mapping (uint256 => uint256) m_nft_to_collection;

    //Events
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
