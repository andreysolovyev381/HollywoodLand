// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;


import "../../Libs/ProxyStorage.sol";
import "../../Libs/EternalStorage.sol";

import "../../NFT/Libs/NFTStructs.sol";
import "../../Libs/IERC777Wrapper.sol";
import "../../ProjectCatalog/IProjectCatalog.sol";
import "../../NFT/NFTCatalog/INFTCatalog.sol";
import "../../NFT/NFTOwnership/INFTOwnership.sol";


contract GovernorDataSpecificStorage is ProxyStorage{
    // ---------- User Defined Data and Events ----------
    IERC777Wrapper internal m_token;
    IProjectCatalog internal m_project_catalog;
    INFTCatalog internal m_nft_catalog;
    INFTOwnership internal m_nft_ownership;

    address internal m_company_account;
    address internal m_governance_admin_account;

    event NativeTokenSet(address token);
    event ProjectCatalogSet(address project_catalog);
    event NFTCatalogSet(address nft_catalog);
    event NFTOwnershipSet(address nft_ownership);
    // -------------------------------------
}


contract ExternalGovernorStorage is GovernorDataSpecificStorage, EternalStorage {
}
