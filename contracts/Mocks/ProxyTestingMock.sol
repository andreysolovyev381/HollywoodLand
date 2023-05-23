//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract ProxyTestingMock is Initializable  {

    function initialize() public initializer {}

    function proxyTesting () public pure returns (string memory) {
        return "For testing Proxy only";
    }
    function getCurrentVersion() public pure returns (string memory) {
        return "no version";
    }


}
