//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../../Libs/EternalStorage.sol";
import "../PriceOracle/IPriceOracle.sol";

//Token specific storage, used at the moment of initial deployment
contract HWLT_SpecificStorage {

    //Token specific storage
    bytes32 internal constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address internal m_company_account;
    uint256 internal m_max_supply;
    string[] internal m_implementation_version;

    //Trial period specific
    mapping (address => bool) internal m_registered_addresses;
    uint256 internal m_trial_finish;

    //Pricr Oracle specific
    IPriceOracle internal m_price_oracle;
    bool internal m_price_oracle_is_set = false;

    //Events
    event PriceOracleSet(address indexed by, address indexed oracle);
}



contract ExternalTokenStorage is HWLT_SpecificStorage, EternalStorage {
}
