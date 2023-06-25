// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;


import "../../Libs/ProxyStorage.sol";
import "../../Libs/EternalStorage.sol";

contract GovernorDataSpecificStorage is ProxyStorage{
    // ---------- User Defined Data and Events ----------
    address internal m_company_account;
    address internal m_governance_admin_account;
    // -------------------------------------
}


contract ExternalGovernorStorage is GovernorDataSpecificStorage, EternalStorage {
}
