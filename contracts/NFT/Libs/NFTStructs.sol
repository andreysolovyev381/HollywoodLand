//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

library NFTStructs {
    enum NftType {
        Project,
        Stake,
        Debt,
        Collection,
        ProjectArt,
        Ticket,
        Other
    }
    uint constant NftTypeLength = 7;

    struct NFT {
        NftType _type;
        string _uri;
        bool _minted;
        bool _burned;
        uint256 _last_price;
    }

    enum TransactionStatus {
        Created,
        Approved,
        Rejected,
        Completed
    }

    struct Transaction {
        bool _initialized;
        bool _closed;
        address _from;
        address _to;
        uint256 _nft_id;
        uint256 _shares;
        uint256 _price;
        uint256 _fee;
        TransactionStatus _status;
        bool _is_ether_payment;
    }
}
