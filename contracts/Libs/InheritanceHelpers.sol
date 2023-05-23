// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

abstract contract ControlBlock is AccessControl, Initializable {}

abstract contract ControlTransparentUpgradeableBlock is AccessControl, Initializable, TransparentUpgradeableProxy {
    function implementation() external virtual view onlyRole(DEFAULT_ADMIN_ROLE) returns (address) {
        return _implementation();
    }
    function upgradeTo(address newImplementation) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _upgradeTo(newImplementation);
    }
}

contract AligningDataStorage {
    bytes32 private constant _DUMMY1 = 0;
    bytes32 private constant _DUMMY2 = 0;
}
