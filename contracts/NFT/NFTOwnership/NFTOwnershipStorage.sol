//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../../Libs/EternalStorage.sol";
import "../../Libs/ProxyStorage.sol";
import "../../Libs/IterableSet.sol";



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
