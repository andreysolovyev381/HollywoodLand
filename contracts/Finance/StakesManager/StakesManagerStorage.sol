//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;


import "../../Libs/ProxyStorage.sol";
import "../../Libs/EternalStorage.sol";
import "../../Libs/IterableSet.sol";


contract StakesManager_SpecificStorage is ProxyStorage {

    //admin management
    bytes32 internal constant FUNDS_MANAGER_ROLE = keccak256("FUNDS_MANAGER_ROLE");
    address internal m_funds_manager_account;

    uint256 m_withdrawal_fee;
    uint256 constant PIPS_COUNT = 10000;

    //Where the tokens are either earned or spent
    address internal m_company_account;

    //Secondary indexes
    mapping(uint256 => IterableSet.Set) m_project_to_stakes;
    mapping(uint256 => uint256) internal m_stake_to_tokens;

    //Events
    event CompanyAccountSet(address company_account);

    event Staked(address indexed from, uint256 indexed project_id, uint256 indexed stake_id, uint256 amount);
    event WithdrawalFeeChanged(address indexed by, uint256 fee_in_pips);
    event Withdrawn(address indexed for_, uint256 indexed project_id, uint256 indexed stake_id,  uint256 amount);
}

contract ExternalStakesManagerStorage is StakesManager_SpecificStorage, EternalStorage {
}
