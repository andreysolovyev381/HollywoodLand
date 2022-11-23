//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

/*
 * https://blog.openzeppelin.com/the-state-of-smart-contract-upgrades/#unstructured-storage
 * What is a smart contract upgrade?
 * A smart contract upgrade is an action that can arbitrarily change the code
 * executed in an address while preserving storage and balance.
 *
*/

import "./GovernanceTokenStorage.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GovernanceTokenProxy is ExternalGovernanceTokenStorage, ERC20Permit, AccessControl, TransparentUpgradeableProxy
{
    constructor(
        string memory _name,
        string memory _symbol,
        address _logic_implementation,
        address _admin_address,
        address _minter_address,
        address _company_account
    )
    ERC20(_name, _symbol) //name, symbol
    ERC20Permit(_name)
        TransparentUpgradeableProxy(_logic_implementation, _admin_address, bytes('')) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin_address);
        _grantRole(MINTER_ROLE, _minter_address);

        m_name = _name;
        m_symbol = _symbol;
        m_company_account = _company_account;
    }
}


