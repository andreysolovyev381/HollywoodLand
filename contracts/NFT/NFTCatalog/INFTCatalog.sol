//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../Libs/NFTStructs.sol";

interface INFTCatalog {
    function mint (
        address new_owner,
        string memory _type,
        string memory uri,
        uint256 collection_id,
        uint256 project_id,
        uint256 shares
    ) external returns (uint256);
    function mintFrom (uint256 nft_id_src) external returns (uint256);
    function burn(address from_owner, uint256 nft_id) external;
    function approveTransaction(
        address from,
        address to,
        uint256 nft_id,
        uint256 shares,
        uint256 price,
        bool is_ether_payment
    ) external returns (uint256);
    function implementTransaction(uint256 tx_id) external payable;

    function getNFT(uint256 nft_id) external view returns (NFTStructs.NFT memory);
    function getCollectionOfToken(uint256 nft_id) external view returns (uint256 collection_id);
    function getProjectOfToken(uint256 nft_id) external view returns (uint256 project_id);

    function isOkNft(uint256 id) external view returns (bool);
    function isNoNft(uint256 id) external view returns (bool);
    function isNftBurned(uint256 id) external view returns (bool);
}
