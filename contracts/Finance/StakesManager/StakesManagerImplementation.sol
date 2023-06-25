//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

//import "../Libs/ERC777_SenderRecipient.sol";
import "../../NFT/Libs/NFTStructs.sol";

import "../../Libs/ExternalFuncs.sol";
import "../../Libs/IterableSet.sol";
import "../../Libs/InheritanceHelpers.sol";
import "../../Libs/IERC777Wrapper.sol";
import "../../ProjectCatalog/IProjectCatalog.sol";
import "../../NFT/NFTCatalog/INFTCatalog.sol";
import "../../NFT/NFTOwnership/INFTOwnership.sol";


import "./StakesManagerStorage.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract StakesManagerImplementation is ExternalStakesManagerStorage, ControlBlock, ReentrancyGuard {
    using ExternalFuncs for *;
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    IERC777Wrapper internal m_token;
    IProjectCatalog internal m_project_catalog;
    INFTCatalog internal m_nft_catalog;
    INFTOwnership internal m_nft_ownership;

    //Events
    event NativeTokenSet(address token);
    event ProjectCatalogSet(address project_catalog);
    event NFTCatalogSet(address nft_catalog);
    event NFTOwnershipSet(address nft_ownership);

    modifier isSetupOk() {
        require(
            address(m_token) != address(0) &&
            address(m_project_catalog) != address(0) &&
            address(m_nft_catalog) != address(0) &&
            address (m_nft_ownership) != address(0) &&
            m_company_account != address(0)
            , "Setup is not ok SM");
        _;
    }

    constructor() {
        m_name = "Funds Manager Implementation, not for usage";
        m_symbol = "DONT_USE";
    }

    function initialize(string memory version, uint8 version_num) public reinitializer(version_num) onlyRole(MINTER_ROLE) {
        //no 777 in the system
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

    function stake(
        address addr_from,
        uint256 hwlt_tokens,
        uint256 project_id,
        uint256 shares_available
    ) public isSetupOk {
        require (addr_from != address(0), "Address should be valid");
        require (m_project_catalog.projectExists(project_id));
        require (
            m_nft_ownership.isApprovedOperator(addr_from, msg.sender) ||
            m_nft_ownership.isApprovedOperator(addr_from, msg.sender, project_id)
        , "stake: msg.sender is not approved");
        require (hwlt_tokens <= m_token.balanceOf(addr_from), "Not enough tokens in the wallet");

        uint256 total_budget = m_project_catalog.getProjectBudgetTotal(project_id);
        uint256 total_stakes = m_project_catalog.getProjectStakesTotal(project_id);

        uint256 expected_budget = hwlt_tokens.add(total_stakes);
        require(expected_budget <= total_budget, "If made your stake would exceed total Project budget");

        //amended as Audit Findings #5
        m_project_catalog.addStakes(project_id, hwlt_tokens);

        m_token.operatorSend(addr_from, m_company_account, hwlt_tokens, bytes(''), bytes(''));

        _stake(addr_from, hwlt_tokens, project_id, shares_available);

    }
    function withdrawStake(address addr_for, uint256 stake_id) public nonReentrant isSetupOk {
        uint256 project_id = m_nft_catalog.getProjectOfToken(stake_id);
        require (m_project_catalog.projectExists(project_id));
        require(m_nft_ownership.isOwner(addr_for, stake_id), "This user has staked nothing");
        require (
            m_nft_ownership.isApprovedOperator(addr_for, msg.sender) ||
            m_nft_ownership.isApprovedOperator(addr_for, msg.sender, stake_id)
        , "withdrawStake: msg.sender is not approved");

        NFTStructs.NFT memory current = m_nft_catalog.getNFT(stake_id);
        require (current._type == NFTStructs.NftType.Stake, "This is not a stake id");

        uint256 total_shares = m_nft_ownership.getTotalSharesForNFT(stake_id);
        uint256 available_shares = m_nft_ownership.getSharesAvailable(addr_for, stake_id);
        uint256 withdraw_from_stake = m_stake_to_tokens[stake_id].mul(available_shares).div(total_shares);
        uint256 withdraw_from_user = withdraw_from_stake;
        uint256 fee = 0;

        if (isWithdrawalFeeSet()) {
            withdraw_from_user = getVolumeAfterWithdrawalFee(withdraw_from_stake);
            fee = withdraw_from_stake.sub(withdraw_from_user);
//            if (m_nft_ownership.getOwnersCount(stake_id) != 1) {
                _stake(m_company_account, fee, project_id, 1);
//            }
        }
        require (withdraw_from_user <= m_token.balanceOf(m_company_account), "Not enough tokens in Main Wallet");

        m_project_catalog.spendStakes(project_id, withdraw_from_user);

        m_nft_catalog.burn(addr_for, stake_id);
        bool is_burned = m_nft_catalog.isNftBurned(stake_id);

        uint256 whats_left = m_stake_to_tokens[stake_id].sub(withdraw_from_stake);
        bool data_is_consistent = (is_burned == (whats_left == 0));
        require (data_is_consistent,
            ExternalFuncs.getErrorMsg("Data is not consistent while burning Stakes NFT", stake_id));

        if (is_burned){
            delete m_stake_to_tokens[stake_id];
            IterableSet.erase(m_project_to_stakes[project_id], stake_id);
        }

        m_token.operatorSend(m_company_account, addr_for, withdraw_from_user, bytes(''), bytes(''));

        emit Withdrawn(addr_for, project_id, stake_id, withdraw_from_user);
    }

    function setWithdrawalFee (uint256 fee_in_pips) public onlyRole(FUNDS_MANAGER_ROLE) isSetupOk {
        m_withdrawal_fee = fee_in_pips;
        emit WithdrawalFeeChanged(msg.sender, fee_in_pips);
    }
    function getWithdrawalFee() public view returns (uint256) {
        return m_withdrawal_fee;
    }
    function isWithdrawalFeeSet() private view returns (bool) {
        return m_withdrawal_fee != 0;
    }
    function getVolumeAfterWithdrawalFee(uint256 volume) private view returns (uint256) {
        return volume.sub(volume.mul(m_withdrawal_fee).div(PIPS_COUNT));
    }

    function getStakeVolume(uint256 stake_id) public view isSetupOk returns (uint256) {
        require (m_nft_catalog.isOkNft(stake_id), "no such Stake");
        return m_stake_to_tokens[stake_id];
    }
    function getProjectStakeIds (uint256 project_id) public view returns (uint256[] memory) {
        require (m_project_catalog.projectExists(project_id));
        return m_project_to_stakes[project_id].keys;
    }

    function _stake(
        address addr_from,
        uint256 hwlt_tokens,
        uint256 project_id,
        uint256 shares_available
    ) private {
        /*
        address new_owner,
        string memory _type,
        string memory uri,
        uint256 collection_id,
        uint256 project_id,
        uint256 price,
        uint256 shares
        */
        uint256 new_stake_id = m_nft_catalog.mint(
            addr_from,
            "Stake",
            "",
            0,
            project_id,
            shares_available
        );

        m_stake_to_tokens[new_stake_id] = hwlt_tokens;
        IterableSet.insert(m_project_to_stakes[project_id], new_stake_id);

        emit Staked(addr_from, project_id, new_stake_id, hwlt_tokens);
    }


}//!contract
