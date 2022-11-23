//SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../Libs/NFTStructs.sol";

interface INFT_TransactionPool {
    function getTransaction (uint256 tx_id) external view returns (NFTStructs.Transaction memory);
    function setTransactionStatus (uint256 tx_id, NFTStructs.TransactionStatus new_status) external;
    function makeTransaction (address from, address to, uint256 nft_id, uint256 shares, uint256 price, bool is_ether_payment) external returns (uint256);
    function deleteTransaction (uint256 tx_id, NFTStructs.TransactionStatus new_status) external;
    function setTransactionFee(string memory nft_type, uint256 fee) external;
    function getTransactionFee(uint256 nft_id) external view returns (uint256);
    function getTransactionFeeTX(uint256 nft_id) external view returns (uint256);
    function getOngoingTransactions(address adrr) external view returns (uint256[] memory);
    function checkTransactionCreationAllowed(address from, uint256 nft_id) external view returns (bool);

    }
