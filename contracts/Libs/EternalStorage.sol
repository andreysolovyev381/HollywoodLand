//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

contract EternalStorage {
    //Reserved for future amendments
    mapping(bytes32 => uint256) internal uint_storage;
    mapping(bytes32 => int256) internal int_storage;
    mapping(bytes32 => string) internal string_storage;
    mapping(bytes32 => address) internal address_storage;
    mapping(bytes32 => bytes32) internal bytes_storage;
    mapping(bytes32 => bool) internal bool_storage;
}
