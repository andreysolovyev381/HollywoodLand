//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

/*
 * https://blog.openzeppelin.com/the-state-of-smart-contract-upgrades/#unstructured-storage
 * What is a smart contract upgrade?
 * A smart contract upgrade is an action that can arbitrarily change the code
 * executed in an address while preserving storage and balance.
 *
*/

import "./TokenStorage.sol";
import "../../Libs/ERC777WrapperStorage.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract TokenProxy is ExternalTokenStorage, ExternalERC777Storage, AccessControl, TransparentUpgradeableProxy
{
    constructor(
        string memory name,
        string memory symbol,
        uint256 _max_supply,
        address _logic_implementation,
        address _admin_account,
        address _minter_account)
    TransparentUpgradeableProxy(_logic_implementation, _admin_account, bytes('')) {
        _name = name;
        _symbol = symbol;
        m_max_supply = _max_supply;
        m_company_account = _minter_account; //todo: check how it relates to managing_account
        _grantRole(DEFAULT_ADMIN_ROLE, _admin_account);
        _grantRole(MINTER_ROLE, _minter_account);

        m_trial_finish = block.timestamp + 31536000; //+1 year from now
    }
}
