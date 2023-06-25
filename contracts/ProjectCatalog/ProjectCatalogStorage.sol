//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "../Libs/EternalStorage.sol";
import "../Libs/IterableSet.sol";
import "../Libs/ProxyStorage.sol";

contract ProjectCatalog_SpecificStorage is ProxyStorage{

    enum ProjectType {
        Screenplay,
        Production,
        Completed
    }
    uint constant ProjectTypeLength = 3;
    enum RoadBlocks {
        Script,
        Producer,
        Director,
        LineBudget,
        Production,
        Distribution,
        BoxOffice,
        Purchase,
        Stream
}
    uint constant RoadBlocksLength = 9;
    struct Project {
        string _name;
        ProjectType _type;
        RoadBlocks _road_block;
        bool _active;
    }

    struct ProjectBudget {

        uint256 _timestamp_create;
        uint256 _timestamp_close;

        uint256 _budget;
        uint256 _stakes;
        uint256 _stakes_spent;

        uint256 _cast_and_crew_share;

        bool _exists;
        bool _closed;
    }

    //admin management
    bytes32 internal constant PROJECT_MANAGER_ROLE = keccak256("PROJECT_MANAGER_ROLE");
    address internal m_project_manager_account;
    //Where the tokens are either earned or spent
    address internal m_company_account;

    mapping (uint256 => Project) m_projects;
    mapping (uint256 => ProjectBudget) internal m_budgets;

    //Events
    event ProjectCreated(address indexed by_address, string name, uint256 indexed id);
    event ProjectDeleted(address indexed by_address, uint256 indexed id);
    event OwnershipOfProjectDeleted(address indexed by_address, uint256 indexed id);
    event ProjectRoadBlockShifted(address indexed by_address, uint256 indexed id);

    event ProjectBudgetCreated(address indexed by, uint256 indexed project_id);
    event ProjectBudgetUpdated(address indexed by, uint256 indexed project_id);
//    event ProjectBudgetSpent(address indexed by, uint256 indexed project_id);
    event ProjectBudgetClosed(address indexed by, uint256 indexed project_id);
}

contract ExternalProjectCatalogStorage is ProjectCatalog_SpecificStorage, EternalStorage {
}
