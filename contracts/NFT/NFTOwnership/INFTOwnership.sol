//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../Libs/NFTStructs.sol";

interface INFTOwnership {
    function startOwnership (address new_owner, address by, uint256 nft_id, uint256 shares) external;
    function approveTransaction(address by, uint256 tx_id) external;
    function cancelTransaction(address by, uint256 tx_id) external;
    function transferOwnership (address by, uint256 tx_id) external;
    function burnOwnership (address for_owner, address by, uint256 nft_id) external returns (bool);

    function getTotalSharesForNFT (uint256 nft_id) external view returns (uint256);
    function getSharesTotal (address owner, uint256 nft_id) external view returns (uint256);
    function getSharesAvailable (address owner, uint256 nft_id) external view returns (uint256);
    function getSharesBlocked (address owner, uint256 nft_id) external view returns (uint256);
    function getOwnershipForAddress (address owner) external view returns (uint256[] memory);
    function getOwnershipForNFT (uint256 nft_id) external view returns (address[] memory);
    function getOwnersCount (uint256 nft_id) external view returns (uint256);
    function isNotCreated (uint256 nft_id) external view returns (bool);
    function isActive (uint256 nft_id) external view returns (bool);
    function isBurned (uint256 nft_id) external view returns (bool);

    function isOwner(address owner, uint256 nft_id) external view returns (bool);
    function isApprovedOperator(address owner, address operator, uint256 nft_id) external view returns (bool);
    function isApprovedOperator(address owner, address operator) external view returns (bool);
}
