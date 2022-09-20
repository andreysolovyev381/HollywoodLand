//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IRevenuesManager {
    function getProjectRevenuesToDistribute (uint256 project_id) external view returns (uint256) ;
}

