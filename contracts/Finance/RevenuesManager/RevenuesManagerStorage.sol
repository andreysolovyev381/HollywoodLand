//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../../Libs/ProxyStorage.sol";
import "../../Libs/EternalStorage.sol";
import "../../Libs/IterableSet.sol";


contract RevenuesManager_SpecificStorage is ProxyStorage {

    struct Beneficiary {
        address _owner;
        uint256 _eth_volume;
    }

    struct Revenue {
        uint256 _timestamp_create;
        uint256 _timestamp_distributed;
        uint256 _eth_volume;
        bool _distributed;
        bool _exists;

        Beneficiary[] _beneficiaries;
    }

    struct ProjectRevenues {
        //timestamp  => revenue
        mapping (uint256 => Revenue) _time_stamps_to_revenues;
        uint256 _total_revenues_available;
    }

    //because stake was too deep
    struct RevenueShareHelper {
        uint256 _stakes_total;
        uint256 _total_shares;
        uint256 _stake_volume;
        uint256 _owner_shares;
        uint256 _revenue_share;
        uint256 _stake_id;
    }

    bytes32 internal constant FUNDS_MANAGER_ROLE = keccak256("FUNDS_MANAGER_ROLE");
    address m_company_account;
    address m_funds_manager_account;

    //project_id => revenues
    mapping (uint256 => ProjectRevenues) internal m_revenues;
    mapping (uint256 => IterableSet.Set) internal m_project_to_revenue_timestamps;

    //Events
    event CompanyAccountSet(address company_account);

    event RevenueRegistered(address indexed by, uint256 indexed project_id, uint256 amount);
    event RevenueDistributed(uint256 indexed project_id, uint256 amount);

}

contract ExternalRevenuesManagerStorage is RevenuesManager_SpecificStorage, EternalStorage {
}

