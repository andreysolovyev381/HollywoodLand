//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./ProjectCatalogStorage.sol";
import "../Libs/ExternalFuncs.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";


contract ProjectCatalogImplementation is ExternalProjectCatalogStorage, AccessControl, Initializable {
    using ExternalFuncs for *;
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    modifier isSetupOk() {
        require(
            address(m_nft_catalog) != address(0) &&
            address(m_nft_ownership) != address(0) &&
            address(m_debt_manager) != address(0) &&
            address(m_revenues_manager) != address(0) &&
            address(m_stakes_manager) != address(0)
        , "Setup is not ok PC");
        _;
    }
    modifier isSystemCall() {
        require(
            msg.sender == address(m_stakes_manager)
        , "Not a system call");
        _;
    }

    constructor() {
        m_name = "Project Catalog Implementation, not for usage";
        m_symbol = "DONT_USE";
    }

    function initialize(string memory version) public initializer onlyRole(MINTER_ROLE) {
        m_implementation_version.push(version);
    }
    function name() public view returns (string memory) {
        return m_name;
    }
    function symbol() public view returns (string memory) {
        return m_symbol;
    }
    //todo: DRY
    function getCurrentVersion () public view returns (string memory) {
        return m_implementation_version[m_implementation_version.length - 1];
    }
    //todo: DRY
    function getVersionHistory () public view returns (string[] memory) {
        return m_implementation_version;
    }
    function setNFTCatalog (address nft_catalog) public onlyRole(MINTER_ROLE) {
        require (nft_catalog != address(0), "Address should be valid");
        m_nft_catalog = INFTCatalog(nft_catalog);
        emit NFTCatalogSet(nft_catalog);
    }
    function setNFTOwnership (address nft_ownership) public onlyRole(MINTER_ROLE) {
        require (nft_ownership != address(0), "no address");
        m_nft_ownership = INFTOwnership(nft_ownership);
        emit NFTOwnershipSet(nft_ownership);
    }
    function setDebtManager (address debt_manager) public onlyRole(MINTER_ROLE) {
        require (debt_manager != address(0), "no address");
        m_debt_manager = IDebtManager(debt_manager);
        emit DebtManagerSet(debt_manager);
    }
    function setRevenuesManager (address revenues_manager) public onlyRole(MINTER_ROLE) {
        require (revenues_manager != address(0), "no address");
        m_revenues_manager = IRevenuesManager(revenues_manager);
        emit RevenuesManagerSet(revenues_manager);
    }
    function setStakesManager (address stakes_manager) public onlyRole(MINTER_ROLE) {
        require (stakes_manager != address(0), "no address");
        m_stakes_manager = IStakesManager(stakes_manager);
        emit StakesManagerSet(stakes_manager);
    }


    function projectExists(uint256 project_id) public view isSetupOk returns (bool) {
        NFTStructs.NFT memory nft = m_nft_catalog.getNFT(project_id);
        require (nft._type == NFTStructs.NftType.Project, "no Project with this id");
        return m_projects[project_id]._active;
    }

    function createProject (
        address by_owner
    , string memory project_name
    , string memory project_type
    , string memory road_block
    , uint256 nft_ownership_total_shares
    ) public isSetupOk returns (uint256) {
        require (by_owner != address(0), "Address should be valid");
        uint256 id = m_nft_catalog.mint(by_owner, "Project", "", 0, 0, 0, nft_ownership_total_shares);
        Project storage project = m_projects[id];
        project._name = project_name;
        project._road_block = getRoadBlockFromStr(road_block);
        project._type = getProjectType(project_type);
        project._active = true;
        emit ProjectCreated(by_owner, project_name, id);
        return id;
    }
    function deleteProject (address owner, uint256 project_id) public isSetupOk {
        require (projectExists(project_id));
        require (m_nft_ownership.isOwner(owner, project_id), "Must be an owner to manage a project");
        require (
            m_nft_ownership.isApprovedOperator(owner, msg.sender) ||
            m_nft_ownership.isApprovedOperator(owner, msg.sender, project_id)
        , "msg.sender is not approved");

        require (!checkProjectHasDebt(project_id), "Project has debt");
        require (!checkProjectHasRevenues(project_id), "Project has revenues");
        require (!checkProjectHasStakes(project_id), "Project has stakes");

        m_nft_catalog.burn(owner, project_id);
        bool is_burned = m_nft_ownership.isBurned(project_id);

        if (is_burned) {
            m_projects[project_id]._active = false;
            emit ProjectDeleted(msg.sender, project_id);
        }
        else {
            emit OwnershipOfProjectDeleted(msg.sender, project_id);
        }
    }

    function nextRoadBlock (address addr_from, uint256 project_id) public isSetupOk {
        require (projectExists(project_id), "No project with such ID");
        require (m_nft_ownership.isOwner(addr_from, project_id), "Must be an owner to manage a project");
        require (
            m_nft_ownership.isApprovedOperator(addr_from, msg.sender) ||
            m_nft_ownership.isApprovedOperator(addr_from, msg.sender, project_id)
        , "msg.sender is not approved");

        uint256 rb = uint256(m_projects[project_id]._road_block).add(1);
        if (rb >= RoadBlocksLength) revert ("Can't move forward a Roadblock");
        m_projects[project_id]._road_block = RoadBlocks(rb);
        emit ProjectRoadBlockShifted(msg.sender, project_id);
    }
    function getRoadBlock (uint256 project_id) public view returns (RoadBlocks){
        require (projectExists(project_id));
        return RoadBlocks(m_projects[project_id]._road_block);
    }

    function getProjectTypes () public pure returns (string[ProjectTypeLength] memory) {
        return [
        "Screenplay"
        , "Production"
        , "Completed"
        ];
    }
    function checkProjectType (string memory project_type) private pure returns (bool) {
        return
        ExternalFuncs.equal(project_type, "screenplay")
        || ExternalFuncs.equal(project_type, "production")
        || ExternalFuncs.equal(project_type, "completed");
    }
    function getProjectType (string memory project_type) private pure returns (ProjectType) {
        string memory l = ExternalFuncs.toLower(project_type);
        require (checkProjectType(l), "Invalid project_type, check getProjectTypes() entrypoint");
        if (ExternalFuncs.equal(l, "screenplay")) return ProjectType.Screenplay;
        else if (ExternalFuncs.equal(l, "production")) return ProjectType.Production;
        else if (ExternalFuncs.equal(l, "completed")) return ProjectType.Completed;
        else revert ("Unknown error in getProjectType()");
    }

    function getRoadBlocks () public pure returns (string[RoadBlocksLength] memory) {
        return [
        "Script"
        , "Producer"
        , "Director"
        , "LineBudget"
        , "Production"
        , "Distribution"
        , "BoxOffice"
        , "Purchase"
        , "Stream"
        ];
    }
    function checkRoadBlock (string memory road_block) private pure returns (bool) {
        return
        ExternalFuncs.equal(road_block, "script")
        || ExternalFuncs.equal(road_block, "producer")
        || ExternalFuncs.equal(road_block, "director")
        || ExternalFuncs.equal(road_block, "linebudget")
        || ExternalFuncs.equal(road_block, "production")
        || ExternalFuncs.equal(road_block, "distribution")
        || ExternalFuncs.equal(road_block, "boxoffice")
        || ExternalFuncs.equal(road_block, "purchase")
        || ExternalFuncs.equal(road_block, "stream");
    }
    function getRoadBlockFromStr(string memory road_block) private pure returns (RoadBlocks) {
        string memory l = ExternalFuncs.toLower(road_block);
        require (checkRoadBlock(l), "Invalid road_block, check getRoadBlocks() entrypoint");
        if      (ExternalFuncs.equal(l, "script")) return RoadBlocks.Script;
        else if (ExternalFuncs.equal(l, "producer")) return RoadBlocks.Production;
        else if (ExternalFuncs.equal(l, "director")) return RoadBlocks.Director;
        else if (ExternalFuncs.equal(l, "linebudget")) return RoadBlocks.LineBudget;
        else if (ExternalFuncs.equal(l, "production")) return RoadBlocks.Production;
        else if (ExternalFuncs.equal(l, "distribution")) return RoadBlocks.Distribution;
        else if (ExternalFuncs.equal(l, "boxoffice")) return RoadBlocks.BoxOffice;
        else if (ExternalFuncs.equal(l, "purchase")) return RoadBlocks.Purchase;
        else if (ExternalFuncs.equal(l, "stream")) return RoadBlocks.Stream;
        else revert ("Unknown error in getRoadBlock()");
    }

    function registerProjectBudget (
        address addr_from,
        uint256 project_id,
        uint256 budget,
        uint256 cast_and_crew_share
    ) public {
        require (addr_from != address(0), "Address should be valid");
        require (projectExists(project_id));
        require (m_nft_ownership.isOwner(addr_from, project_id), "Must be an owner to manage a project");
        require (
            m_nft_ownership.isApprovedOperator(addr_from, msg.sender) ||
            m_nft_ownership.isApprovedOperator(addr_from, msg.sender, project_id)
        , "msg.sender is not approved");
        require (!m_budgets[project_id]._exists, "Project budget already exists");

        ProjectBudget memory project_budget;
        project_budget._budget = budget;
        project_budget._timestamp_create = ExternalFuncs.Today();
        project_budget._cast_and_crew_share = cast_and_crew_share;
        project_budget._exists = true;
        m_budgets[project_id] = project_budget;

        emit ProjectBudgetCreated(msg.sender, project_id);
    }
    function updateProjectBudget (
        address addr_from,
        uint256 project_id,
        uint256 new_budget,
        uint256 new_cast_and_crew_share
    ) public {
        require (addr_from != address(0), "Address should be valid");
        require (projectExists(project_id));
        require (m_nft_ownership.isOwner(addr_from, project_id), "Must be an owner to manage a project");
        require (
            m_nft_ownership.isApprovedOperator(addr_from, msg.sender) ||
            m_nft_ownership.isApprovedOperator(addr_from, msg.sender, project_id)
        , "msg.sender is not approved");
        require (checkProjectBudgetIsActive(project_id), "Project budget either doesn't exist or is closed");

        m_budgets[project_id]._budget = new_budget;
        m_budgets[project_id]._cast_and_crew_share = new_cast_and_crew_share;

        emit ProjectBudgetUpdated(addr_from, project_id);
    }
//    function spendBudget (
//        uint256 project_id,
//        uint256 tokens_to_spend
//    ) public onlyRole(MINTER_ROLE) {
//        require (projectExists(project_id));
//        require (checkProjectBudgetIsActive(project_id), "Project budget either doesn't exist or is closed");
//
//        uint256 available = m_budgets[project_id]._stakes.sub(m_budgets[project_id]._stakes_spent);
//        require (available >= tokens_to_spend, "Not enough budget to spend");
//
//        m_budgets[project_id]._stakes_spent = m_budgets[project_id]._stakes_spent.add(tokens_to_spend);
//
//        emit ProjectBudgetSpent(addr_from, project_id);
//    }

    function closeProjectBudget (address addr_from, uint256 project_id) public isSetupOk {
        require (addr_from != address(0), "Address should be valid");
        require (projectExists(project_id));
        require (m_nft_ownership.isOwner(addr_from, project_id), "Must be an owner to manage a project");
        require (
            m_nft_ownership.isApprovedOperator(addr_from, msg.sender) ||
            m_nft_ownership.isApprovedOperator(addr_from, msg.sender, project_id)
        , "msg.sender is not approved");
        require (checkProjectBudgetIsActive(project_id), "Project budget either doesn't exist or is closed");
        require (!checkProjectHasDebt(project_id), "Project has debt");
        require (!checkProjectHasRevenues(project_id), "Project has revenues");
        require (!checkProjectHasStakes(project_id), "Project has stakes");

        m_budgets[project_id]._timestamp_close = ExternalFuncs.Today();
        m_budgets[project_id]._closed = true;
        emit ProjectBudgetClosed(msg.sender, project_id);
    }

    function getProjectBudgetTotal (uint256 project_id) public view returns (uint256) {
        require (projectExists(project_id));
        require (checkProjectBudgetIsActive(project_id), "Project budget either doesn't exist or is closed");
        return m_budgets[project_id]._budget;
    }
    function getProjectStakesTotal (uint256 project_id) public view returns (uint256) {
        require (projectExists(project_id));
        require (checkProjectBudgetIsActive(project_id), "Project budget either doesn't exist or is closed");
        return m_budgets[project_id]._stakes;
    }
    function getProjectStakesAvailable (uint256 project_id) public view returns (uint256) {
        require (projectExists(project_id));
        require (checkProjectBudgetIsActive(project_id), "Project budget either doesn't exist or is closed");
        uint256 available = m_budgets[project_id]._stakes.sub(m_budgets[project_id]._stakes_spent);
        return available;
    }
    function addStakes (uint256 project_id, uint256 tokens_to_add) public isSystemCall {
        require (projectExists(project_id));
        require (checkProjectBudgetIsActive(project_id), "Project budget either doesn't exist or is closed");
        m_budgets[project_id]._stakes = m_budgets[project_id]._stakes.add(tokens_to_add);
    }
    function spendStakes (uint256 project_id, uint256 tokens_to_spend) public isSystemCall {
        require (projectExists(project_id));
        require (checkProjectBudgetIsActive(project_id), "Project budget either doesn't exist or is closed");
        m_budgets[project_id]._stakes_spent = m_budgets[project_id]._stakes_spent.add(tokens_to_spend);
    }


    function checkProjectBudgetIsActive(uint256 project_id) private view returns (bool) {
        return m_budgets[project_id]._exists && !m_budgets[project_id]._closed;
    }

    function checkProjectHasDebt(uint256 project_id) private view isSetupOk returns (bool) {
        require (projectExists(project_id));
        return (m_debt_manager.projectDebtExists(project_id));

    }
    function checkProjectHasStakes(uint256 project_id) private view isSetupOk returns (bool) {
        uint256[] memory ids = m_stakes_manager.getProjectStakeIds(project_id);
        return (ids.length != 0);
    }
    function checkProjectHasRevenues(uint256 project_id) private view isSetupOk returns (bool) {
        require (projectExists(project_id));
        uint256 revenues_to_distribute = m_revenues_manager.getProjectRevenuesToDistribute(project_id);
        return (revenues_to_distribute != 0);
    }
}
