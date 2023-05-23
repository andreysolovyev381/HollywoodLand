//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../../NFT/Libs/NFTStructs.sol";

import "../../Libs/ExternalFuncs.sol";
import "../../Libs/IterableSet.sol";
import "../../Libs/InheritanceHelpers.sol";
import "./DebtManagerStorage.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract DebtManagerImplementation is ExternalDebtManagerStorage, ControlBlock {
    using ExternalFuncs for *;
    using SafeMath for uint256;

    modifier isSetupOk() {
        require(
            address(m_token) != address(0) &&
            address(m_project_catalog) != address(0) &&
            address(m_nft_catalog) != address(0) &&
            address (m_nft_ownership) != address(0) &&
            m_company_account != address(0)
        , "Setup is not ok DM");
        _;
    }

    constructor() {
        m_name = "Debt Manager Implementation, not for usage";
        m_symbol = "DONT_USE";
    }

    function initialize(string memory version, uint8 version_num) public reinitializer(version_num) onlyRole(MINTER_ROLE) {
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

    function registerDebt (
        address debtor,
        uint256 project_id,
        uint256 volume,
        uint256 apy_rate,
        uint256 nft_ownership_total_shares
    ) public isSetupOk onlyRole(FUNDS_MANAGER_ROLE) {
        require (debtor != address(0), "Address should be valid");
        require (m_project_catalog.projectExists(project_id));

        //no need to have an Operator check - ONLY FUNDS_MANAGER_ROLE can call this func

        uint256 debt_id = m_nft_catalog.mint(
            debtor,
            "Debt",
            "",
            0,
            project_id,
            volume,
            nft_ownership_total_shares);

        m_project_debts[project_id]._exists = true;
        IterableSet.insert(m_project_debts[project_id]._individual_debts, debt_id);

        m_individual_debts[project_id][debt_id]._exists = true;
        m_individual_debts[project_id][debt_id]._principal._initial = volume;
        m_individual_debts[project_id][debt_id]._principal._paid = 0;

        Interest memory _interest;
        _interest._apy_rate = apy_rate;
        _interest._timestamp_start = ExternalFuncs.Today();
        _interest._is_paid = false;
        m_individual_debts[project_id][debt_id]._interest.push(_interest);

        emit DebtRegistered(debtor, project_id, debt_id, volume, apy_rate);
    }
    function getProjectDebtOutstanding (uint256 project_id) public view isSetupOk returns (uint256, uint256) {
        require (m_project_catalog.projectExists(project_id));
        require (m_project_debts[project_id]._exists, "No such debt");
        return getProjectIndebtnessForToday(project_id);
    }
    function getProjectDebtIds (uint256 project_id) public view isSetupOk returns (uint256[] memory) {
        require (m_project_catalog.projectExists(project_id));
        require (m_project_debts[project_id]._exists, "No such debt");
        return m_project_debts[project_id]._individual_debts.keys;
    }
    function getIndividualDebtOutstanding (uint256 debt_id) public view isSetupOk returns (uint256, uint256) {
        uint256 project_id = m_nft_catalog.getProjectOfToken(debt_id);
        require (m_project_catalog.projectExists(project_id));

        IndividualDebt memory debt = m_individual_debts[project_id][debt_id];
        require (m_individual_debts[project_id][debt_id]._exists, "No such debt");

        return getIndividualIndebtnessForToday(debt);
    }

    function setIndividualDebtRate (uint256 debt_id, uint256 new_apy_rate) public onlyRole(FUNDS_MANAGER_ROLE) isSetupOk{
        uint256 project_id = m_nft_catalog.getProjectOfToken(debt_id);
        require (m_project_catalog.projectExists(project_id));

        IndividualDebt memory debt = m_individual_debts[project_id][debt_id];
        require (debt._exists, "No such debt");

        uint256 last_interest_idx = debt._interest.length - 1;
        m_individual_debts[project_id][debt_id]._interest[last_interest_idx]._timestamp_finish = ExternalFuncs.Today();

        Interest memory _interest;
        _interest._apy_rate = new_apy_rate;
        _interest._timestamp_start = ExternalFuncs.Today();
        _interest._is_paid = false;

        m_individual_debts[project_id][debt_id]._interest.push(_interest);

        emit DebtRateReset(project_id, debt_id, new_apy_rate);
    }
    function getIndividualDebtRate (uint256 debt_id) public view isSetupOk returns (uint256) {
        uint256 project_id = m_nft_catalog.getProjectOfToken(debt_id);
        require (m_project_catalog.projectExists(project_id));
        require (m_individual_debts[project_id][debt_id]._exists, "No such debt");
        uint256 last_interest_idx = m_individual_debts[project_id][debt_id]._interest.length - 1;
        return (m_individual_debts[project_id][debt_id]._interest[last_interest_idx]._apy_rate);
    }

    function payoutProjectDebt (uint256 project_id) public isSetupOk onlyRole(FUNDS_MANAGER_ROLE) isSetupOk {
        require (m_project_catalog.projectExists(project_id));
        require (m_project_debts[project_id]._exists, "No such debt");

        uint256[] memory debt_ids = m_project_debts[project_id]._individual_debts.keys;
        uint size = debt_ids.length;
        uint idx = 0;

        for (; idx != size; ++idx) {
            uint256 debt_id = debt_ids[idx];
            if (!m_individual_debts[project_id][debt_id]._exists) {
                continue;
            }
            _payoutIndividualDebt (project_id, debt_id);
        }
        m_project_debts[project_id]._exists = false;
    }
    function payoutIndividualDebt (uint256 debt_id) public isSetupOk onlyRole(FUNDS_MANAGER_ROLE) {
        uint256 project_id = m_nft_catalog.getProjectOfToken(debt_id);
        require (m_project_catalog.projectExists(project_id));
        require (m_individual_debts[project_id][debt_id]._exists, "No such debt");
        _payoutIndividualDebt (project_id, debt_id);

        if (IterableSet.empty(m_project_debts[project_id]._individual_debts)) {
            m_project_debts[project_id]._exists = false;
        }
    }

    function projectDebtExists (uint256 project_id) public view isSetupOk returns (bool) {
        require (m_project_catalog.projectExists(project_id));
        return m_project_debts[project_id]._exists;
    }
    function individualDebtExists (uint256 debt_id) public view isSetupOk returns (bool) {
        uint256 project_id = m_nft_catalog.getProjectOfToken(debt_id);
        require (m_project_catalog.projectExists(project_id));
        return m_individual_debts[project_id][debt_id]._exists;
    }

    function getIndividualIndebtnessForToday (IndividualDebt memory debt) private view returns (uint256, uint256) {
        uint256 interest_count = debt._interest.length;
        uint256 interest_idx = 0;

        uint256 outstanding = debt._principal._initial.sub(debt._principal._paid);
        uint256 interest = 0;

        for (; interest_idx != interest_count; ++interest_idx) {
            if (!debt._interest[interest_idx]._is_paid) {
                uint256 last_day = debt._interest[interest_idx]._timestamp_finish == 0 ?
                    ExternalFuncs.Today() :
                    debt._interest[interest_idx]._timestamp_finish;

                uint256 _principal;
                uint256 _interest;
                (_principal, _interest) = ExternalFuncs.getTotalPayout(
                    outstanding,
                    debt._interest[interest_idx]._apy_rate,
                    debt._interest[interest_idx]._timestamp_start,
                    last_day,
                    1 //1 day
                );
                interest = interest.add(_interest);
            }
        }
        return (outstanding, interest);
    }
    function getProjectIndebtnessForToday (uint256 project_id) private view returns (uint256, uint256) {

        ProjectDebt storage project_debt = m_project_debts[project_id];

        uint256 principal;
        uint256 interest;

        uint256 individual_debts_count = IterableSet.size(project_debt._individual_debts);
        uint256 individual_debt_idx = 0;

        for (; individual_debt_idx != individual_debts_count; ++individual_debt_idx) {
            uint256 _debt_id = IterableSet.getKeyAtIndex(project_debt._individual_debts, individual_debt_idx);
            IndividualDebt memory individual_debt = m_individual_debts[project_id][_debt_id];
            if (!individual_debt._exists) {
                continue;
            }
            uint256 _principal;
            uint256 _interest;
            (_principal, _interest) = getIndividualIndebtnessForToday(individual_debt);
            principal = principal.add(_principal);
            interest = interest.add(_interest);
        }
        return (principal, interest);
    }

    function _payoutIndividualDebt (uint256 project_id, uint256 debt_id) private isSetupOk {
        IndividualDebt memory debt = m_individual_debts[project_id][debt_id];
        uint256 total_shares = m_nft_ownership.getTotalSharesForNFT(debt_id);
        address[] memory owners = m_nft_ownership.getOwnershipForNFT(debt_id);
        uint256 principal;
        uint256 interest;
        (principal, interest) = getIndividualIndebtnessForToday(debt);
        uint256 total_payout = principal.add(interest);

        require (total_payout != 0, "No payout");
        require (total_payout <= m_token.balanceOf(m_company_account), "not enough Tokens to payout");
        uint256 outstanding = debt._principal._initial.sub(debt._principal._paid);
        require (principal == outstanding, "data inconsistency");

        setIndividualDebtAsPaid(project_id, debt_id);

        for (uint i = 0; i != owners.length; ++i) {
            uint256 shares_owner = m_nft_ownership.getSharesTotal(owners[i], debt_id);
            uint256 payout_to_owner = shares_owner.mul(total_payout).div(total_shares);
            m_token.operatorSend(m_company_account, owners[i], payout_to_owner, bytes(''), bytes(''));
            m_nft_catalog.burn(owners[i], debt_id);
        }

        emit DebtIsPaidOut(project_id, debt_id, total_payout);
    }
    function setIndividualDebtAsPaid(uint256 project_id, uint256 debt_id) private {
        IndividualDebt memory debt = m_individual_debts[project_id][debt_id];
        uint256 interest_count = debt._interest.length;
        uint256 interest_idx = 0;

        for (; interest_idx != interest_count; ++interest_idx) {
            if (!debt._interest[interest_idx]._is_paid) {
                m_individual_debts[project_id][debt_id]._interest[interest_idx]._is_paid = true;
            }
        }
        m_individual_debts[project_id][debt_id]._principal._paid = m_individual_debts[project_id][debt_id]._principal._initial;
        m_individual_debts[project_id][debt_id]._exists = false;
        IterableSet.erase(m_project_debts[project_id]._individual_debts, debt_id);
    }

    //todo: THIS FUNC IS FOR TESTING PURPOSES ONLY. MUST BE DELETED BEFORE DEPLOYMENT
    function addIndividualDebtInterestPeriod (
        uint256 project_id,
        uint256 debt_id,
        uint256 apy_rate,
        uint256 timestamp_start,
        uint256 timestamp_finish
    ) public isSetupOk onlyRole(FUNDS_MANAGER_ROLE) {
        require (m_individual_debts[project_id][debt_id]._exists, "No such debt");

        Interest memory _interest;
        _interest._apy_rate = apy_rate;
        _interest._timestamp_start = timestamp_start / 1 days;
        _interest._timestamp_finish = timestamp_finish / 1 days;
        _interest._is_paid = false;
        m_individual_debts[project_id][debt_id]._interest.push(_interest);
    }
}
