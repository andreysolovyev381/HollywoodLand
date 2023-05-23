//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProxyStorage {
    bytes32 internal constant MINTER_ROLE = keccak256("MINTER_ROLE");
    string internal m_name;
    string internal m_symbol;
    string[] internal m_implementation_version;
}
