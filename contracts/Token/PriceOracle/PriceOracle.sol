//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

//todo: change that later to perform some other business logic

contract PriceOracle is AccessControl {
    uint256 private m_current_price = 0;
    bool private m_is_price_set = false;

    event PriceSet(address indexed by, uint256 value);

    constructor(address _admin_address){
        require (_admin_address != address(0), "Admin address is not set");
        _grantRole(DEFAULT_ADMIN_ROLE, _admin_address);
    }

    function getPrice() public view returns (uint256) {
        require (m_is_price_set, "Init is not complete");
        return m_current_price;
    }
    function setPrice(uint256 new_price) public onlyRole(DEFAULT_ADMIN_ROLE) {
        m_is_price_set = true;
        m_current_price = new_price;
        emit PriceSet(msg.sender, new_price);
    }
}
