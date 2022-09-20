//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IProjectCatalog {
    function projectExists(uint256 project_id) external view returns (bool);

    function getProjectBudgetTotal (uint256 project_id) external view returns (uint256);
    function getProjectStakesTotal (uint256 project_id) external view returns (uint256);
    function getProjectStakesAvailable (uint256 project_id) external view returns (uint256);
    function addStakes (uint256 project_id, uint256 tokens_to_add) external;
    function spendStakes (uint256 project_id, uint256 tokens_to_spend) external;
}
