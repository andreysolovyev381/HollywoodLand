//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/*
 * https://blog.openzeppelin.com/the-state-of-smart-contract-upgrades/#unstructured-storage
 * What is a smart contract upgrade?
 * A smart contract upgrade is an action that can arbitrarily change the code
 * executed in an address while preserving storage and balance.
 *
*/

import "../../Libs/GovernorCoreWrapperDataStorage.sol";
import "../../Libs/InheritanceHelpers.sol";

import "./GovernorDataStorage.sol";


contract GovernorProxy is ExternalGovernorStorage, GovernorCoreWrapperDataStorage, ControlTransparentUpgradeableBlock
{
    constructor(
        string memory name
        , string memory symbol
        , address _logic_implementation
        , address _admin_address
        , address _minter_address
    )
    TransparentUpgradeableProxy(_logic_implementation, _admin_address, bytes('')) {
        m_name = name;
        _name = name;
        m_symbol = symbol;

        m_company_account = _admin_address;
        m_governance_admin_account = _minter_address;
        _grantRole(DEFAULT_ADMIN_ROLE, m_company_account);
        _grantRole(MINTER_ROLE, m_governance_admin_account);
    }
}
