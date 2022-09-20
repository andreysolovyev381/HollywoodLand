//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/utils/introspection/IERC1820Registry.sol";

// ERC777 data storage from the respective OZ file, copy-paste but
// changed from private to internal for obvious reasons
contract ExternalERC777Storage {
    IERC1820Registry internal constant _ERC1820_REGISTRY = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    mapping(address => uint256) internal _balances;
    uint256 internal _totalSupply;
    string internal _name;
    string internal _symbol;
    bytes32 internal constant _TOKENS_SENDER_INTERFACE_HASH = keccak256("ERC777TokensSender");
    bytes32 internal constant _TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    // This isn't ever read from - it's only used to respond to the defaultOperators query.
    address[] internal _defaultOperatorsArray;
    // Immutable, but accounts may revoke them (tracked in __revokedDefaultOperators).
    mapping(address => bool) internal _defaultOperators;
    // For each account, a mapping of its operators and revoked default operators.
    mapping(address => mapping(address => bool)) internal _operators;
    mapping(address => mapping(address => bool)) internal _revokedDefaultOperators;
    // ERC20-allowances
    mapping(address => mapping(address => uint256)) internal _allowances;
}
