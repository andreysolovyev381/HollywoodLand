//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../../Libs/ProxyStorage.sol";

import "../../Libs/IERC777Wrapper.sol";
import "../../ProjectCatalog/IProjectCatalog.sol";
import "../../NFT/NFTCatalog/INFTCatalog.sol";
import "../../NFT/NFTOwnership/INFTOwnership.sol";

import "../../Libs/EternalStorage.sol";
import "../../Libs/IterableSet.sol";

contract DebtManager_SpecificStorage is ProxyStorage {

    struct Principal {
        uint256 _initial;
        uint256 _paid;
    }
    struct Interest {
        uint256 _timestamp_start;
        uint256 _timestamp_finish;
        uint256 _apy_rate;
        bool _is_paid;
    }

    struct IndividualDebt {
        Principal _principal;
        Interest[] _interest;
        bool _exists;
    }

    struct ProjectDebt {
        IterableSet.Set _individual_debts;
        bool _exists;
    }

    bytes32 internal constant FUNDS_MANAGER_ROLE = keccak256("FUNDS_MANAGER_ROLE");
    address m_company_account;
    address m_funds_manager_account;

    IERC777Wrapper internal m_token;
    IProjectCatalog internal m_project_catalog;
    INFTCatalog internal m_nft_catalog;
    INFTOwnership internal m_nft_ownership;

    uint256 constant k_DURATION_PERIOD = 365 days;

    // project_id => individual_id (aka nft_id) => debt
    mapping (uint256 => mapping (uint256 => IndividualDebt)) m_individual_debts;
    mapping(uint256 => ProjectDebt) m_project_debts;


    //Events
    event ERC777Set(address token);
    event ProjectCatalogSet(address project_catalog);
    event CompanyAccountSet(address company_account);
    event NFTCatalogSet(address nft_catalog);
    event NFTOwnershipSet(address nft_ownership);

    event DebtRegistered(address indexed debtor, uint256 indexed project_id, uint256 indexed debt_id, uint256 principal, uint256 apy_rate);
    event DebtIsPaidOut(uint256 indexed project_id, uint256 indexed debt_id, uint256 amount);
    event DebtIsDeleted(address indexed funds_manager, uint256 indexed project_id, uint256 indexed debt_id);
    event DebtRateReset(uint256 indexed project_id, uint256 indexed debt_id, uint256 apy_rate);

}

contract ExternalDebtManagerStorage is DebtManager_SpecificStorage, EternalStorage {
}
