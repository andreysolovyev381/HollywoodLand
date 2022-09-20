//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IDebtManager {

    function registerDebt (
        address debtor,
        uint256 project_id,
        uint256 volume,
        uint256 apy_rate,
        uint256 nft_ownership_total_shares
    ) external;
    function deleteDebt (uint256 debt_id) external;
    function getProjectDebtOutstanding (uint256 project_id) external view returns (uint256, uint256);
    function getProjectDebtIds (uint256 project_id) external view returns (uint256[] memory);
    function getIndividualDebtOutstanding (uint256 debt_id) external view returns (uint256, uint256);

    function setIndividualDebtRate (address debtor, uint256 debt_id, uint256 new_apy_rate) external;
    function getIndividualDebtRate (uint256 debt_id) external view returns (uint256);

    function payoutProjectDebt (uint256 project_id) external;
    function payoutIndividualDebt (uint256 debt_id) external;

    function projectDebtExists (uint256 project_id) external view returns (bool);
    function individualDebtExists (uint256 debt_id) external view returns (bool);

}
