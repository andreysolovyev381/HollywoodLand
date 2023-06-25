//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;


import "../../Libs/ExternalFuncs.sol";
import "../../Libs/IterableSet.sol";
import "../../Libs/InheritanceHelpers.sol";

import "../../Libs/IERC777Wrapper.sol";
import "../../ProjectCatalog/IProjectCatalog.sol";
import "../../NFT/NFTCatalog/INFTCatalog.sol";
import "../../NFT/NFTOwnership/INFTOwnership.sol";
import "../StakesManager/IStakesManager.sol";

import "./RevenuesManagerStorage.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RevenuesManagerImplementation is ExternalRevenuesManagerStorage, ControlBlock, ReentrancyGuard{
    using ExternalFuncs for *;
    using SafeMath for uint256;

    IERC777Wrapper internal m_token;
    IProjectCatalog internal m_project_catalog;
    INFTCatalog internal m_nft_catalog;
    INFTOwnership internal m_nft_ownership;
    IStakesManager internal m_stakes_manager;

    event NativeTokenSet(address token);
    event ProjectCatalogSet(address project_catalog);
    event NFTCatalogSet(address nft_catalog);
    event NFTOwnershipSet(address nft_ownership);
    event StakesManagerSet(address stakes_manager);

    modifier isSetupOk() {
        require(
            address(m_token) != address(0) &&
            address(m_project_catalog) != address(0) &&
            address(m_nft_catalog) != address(0) &&
            address(m_nft_ownership) != address(0) &&
            address(m_stakes_manager) != address(0) &&
            m_company_account != address(0)
        , "Setup is not ok RM");
        _;
    }

    constructor() {
        m_name = "Revenues Manager Implementation, not for usage";
        m_symbol = "DONT_USE";
    }

    function initialize(string memory version, uint8 version_num) public reinitializer(version_num) onlyRole(MINTER_ROLE) {
//        _erc1820.setInterfaceImplementer(address(this), _TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
        m_implementation_version.push(version);
    }

    function setNativeToken (address token) public onlyRole(MINTER_ROLE) {
        require (token != address(0), "Address should be valid");
        m_token = IERC777Wrapper(token);
        emit NativeTokenSet(token);
    }
    function setProjectCatalog (address project_catalog) public onlyRole(MINTER_ROLE) {
        require (project_catalog != address(0), "Address should be valid");
        m_project_catalog = IProjectCatalog(project_catalog);
        emit ProjectCatalogSet(project_catalog);
    }
    function setCompanyAccount (address company_account) public onlyRole(MINTER_ROLE) {
        require (company_account != address(0), "Address should be valid");
        m_company_account = company_account;
        emit CompanyAccountSet(m_company_account);
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
    function setStakesManager (address stakes_manager) public onlyRole(MINTER_ROLE) {
        require (stakes_manager != address(0), "no address");
        m_stakes_manager = IStakesManager(stakes_manager);
        emit StakesManagerSet(stakes_manager);
    }

    function name () public view returns (string memory) {
        return m_name;
    }
    function symbol () public view returns (string memory) {
        return m_symbol;
    }

    function getCurrentVersion () public view returns (string memory) {
        return m_implementation_version[m_implementation_version.length - 1];
    }

    function getVersionHistory () public view returns (string[] memory) {
        return m_implementation_version;
    }

    function registerRevenue (uint256 project_id, uint256 eth_volume) public onlyRole(FUNDS_MANAGER_ROLE) isSetupOk {
        require (m_project_catalog.projectExists(project_id));

        uint256 _now = block.timestamp;

        Revenue storage revenue = m_revenues[project_id]._time_stamps_to_revenues[_now];

        //added as Audit Findings #6
        require (revenue._timestamp_create != _now, "Revenue for this timestamp already exists");

        revenue._timestamp_create = _now;
        revenue._eth_volume = eth_volume;
        revenue._exists = true;

        getBeneficiaries(project_id, revenue);

        m_revenues[project_id]._total_revenues_available
            = m_revenues[project_id]._total_revenues_available.add(eth_volume);
        IterableSet.insert(m_project_to_revenue_timestamps[project_id], _now);

        emit RevenueRegistered(msg.sender, project_id, eth_volume);
    }
    function payoutRevenue (uint256 project_id, uint256 timestamp_threshold) public isSetupOk nonReentrant payable {
        require (msg.sender == m_company_account, "This is BIG payout function, only company address can do it");
        require (m_project_catalog.projectExists(project_id));
        uint256 company_eth_balance = m_company_account.balance;
        uint256 eth_to_transfer = m_revenues[project_id]._total_revenues_available;
        require (company_eth_balance >= eth_to_transfer, "not enough Ether");

        uint256 timestamps_count = IterableSet.size(m_project_to_revenue_timestamps[project_id]);
        uint256 idx_t = 0;
        uint256 total_paid;

        for (; idx_t != timestamps_count; ++idx_t) {
            uint256 timestamp_to_pay = IterableSet.getKeyAtIndex(m_project_to_revenue_timestamps[project_id], idx_t);
            Revenue memory revenue = m_revenues[project_id]._time_stamps_to_revenues[timestamp_to_pay];

            if (timestamp_to_pay > timestamp_threshold) {
                continue;
            }

            if (revenue._exists) {
                m_revenues[project_id]._total_revenues_available =
                    m_revenues[project_id]._total_revenues_available.sub(revenue._eth_volume);
                m_revenues[project_id]._time_stamps_to_revenues[timestamp_to_pay]._exists = false;
                total_paid = total_paid.add(revenue._eth_volume);

                uint256 beneficiary_count = revenue._beneficiaries.length;
                uint256 idx_b = 0;
                for (; idx_b != beneficiary_count; ++idx_b) {
                    Beneficiary memory beneficiary = revenue._beneficiaries[idx_b];
                    if (beneficiary._owner != address(0) && beneficiary._owner != m_company_account) {
                        (bool sent, bytes memory data) = beneficiary._owner.call{value: beneficiary._eth_volume}("");
                        require(sent, "Failed to send Ether");
                    }
                }
            }
        }
        emit RevenueDistributed(project_id, total_paid);
    }
    function getProjectRevenuesToDistribute (uint256 project_id) public view isSetupOk returns (uint256) {
        require (m_project_catalog.projectExists(project_id));
        return m_revenues[project_id]._total_revenues_available;
    }

    function getBeneficiaries (uint256 project_id, Revenue storage revenue) private onlyRole(FUNDS_MANAGER_ROLE) isSetupOk {

        RevenueShareHelper memory helper;
        helper._stakes_total = m_project_catalog.getProjectStakesTotal(project_id);
        uint256[] memory stake_ids = m_stakes_manager.getProjectStakeIds(project_id);

        uint idx_s = 0;
        for (; idx_s != stake_ids.length; ++idx_s) {
            helper._stake_id = stake_ids[idx_s];
            helper._stake_volume = m_stakes_manager.getStakeVolume(helper._stake_id);
            address[] memory owners = m_nft_ownership.getOwnershipForNFT(helper._stake_id);
            helper._total_shares = m_nft_ownership.getTotalSharesForNFT(helper._stake_id);

            for (uint256 i = 0; i != owners.length; ++i) {
                if (owners[i] != address(0)) {
                    helper._owner_shares = m_nft_ownership.getSharesTotal(owners[i], helper._stake_id);
                    helper._revenue_share = revenue._eth_volume.mul(helper._owner_shares).div(helper._total_shares);
                    helper._revenue_share = helper._revenue_share.mul(helper._stake_volume).div(helper._stakes_total);

                    Beneficiary memory beneficiary;
                    beneficiary._owner = owners[i];
                    beneficiary._eth_volume = helper._revenue_share;

                    revenue._beneficiaries.push(beneficiary);
                }
            }
        }
    }
}
