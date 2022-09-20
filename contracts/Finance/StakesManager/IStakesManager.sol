//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IStakesManager {

    function stake(address addr_from, uint256 hwlt_tokens, uint256 project_id, uint256 shares_available) external;
    function withdrawStake(address addr_for, uint256 stake_id) external;
    function setWithdrawalFee (uint256 fee_in_pips) external;
    function getWithdrawalFee() external view returns (uint256);
    function getVolumeAfterWithdrawalFee(uint256 volume) external view returns (uint256);
    function getStakeVolume(uint256 stake_id) external view returns (uint256);
    function getProjectStakeIds (uint256 project_id) external view returns (uint256[] memory);
}

