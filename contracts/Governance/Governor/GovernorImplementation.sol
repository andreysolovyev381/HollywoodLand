// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../../Libs/GovernorCoreWrapper.sol";
import "../../Libs/InheritanceHelpers.sol";
import "../../NFT/Libs/NFTStructs.sol";
import "../../Libs/IERC777Wrapper.sol";
import "../../ProjectCatalog/IProjectCatalog.sol";
import "../../NFT/NFTCatalog/INFTCatalog.sol";
import "../../NFT/NFTOwnership/INFTOwnership.sol";

import "./GovernorDataStorage.sol";

contract GovernorImplementation is ExternalGovernorStorage, GovernorCoreWrapper, ControlBlock {

    IERC777Wrapper internal m_token;
    IProjectCatalog internal m_project_catalog;
    INFTCatalog internal m_nft_catalog;
    INFTOwnership internal m_nft_ownership;

    event NativeTokenSet(address token);
    event ProjectCatalogSet(address project_catalog);
    event NFTCatalogSet(address nft_catalog);
    event NFTOwnershipSet(address nft_ownership);


    modifier isSetupOk() {
        require(
            address(m_governance_token) != address(0) &&
            address(m_token) != address(0) &&
            address(m_nft_catalog) != address(0) &&
            address(m_project_catalog) != address(0) &&
            address(m_nft_ownership) != address(0) &&
            m_company_account != address(0)
        , "Setup is not ok Governor");
        _;
    }

    constructor()
    GovernorCoreWrapper("Governor Implementation, not for usage"
    , address(0)
    , 0
    , 1
    , 0
    , 0) {
        m_name = "Governor Implementation, not for usage";
        m_symbol = "DONT_USE";
    }

    function initialize(
        string memory version
    , uint8 version_num
    , address governance_token
    , uint256 voting_delay
    , uint256 voting_period
    , uint256 proposal_threshold
    , uint256 required_quorum
    ) public reinitializer(version_num) onlyRole(MINTER_ROLE) {
        m_implementation_version.push(version);

        _setVotingDelay(voting_delay);
        _setVotingPeriod(voting_period);
        _setProposalThreshold(proposal_threshold);
        _updateQuorumNumerator(required_quorum);

        m_governance_token = IGovernanceToken(governance_token);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(GovernorCoreWrapper, AccessControl) returns (bool) {
        // In addition to the current interfaceId, also support previous version of the interfaceId that did not
        // include the castVoteWithReasonAndParams() function as standard
        return
        interfaceId ==
        (type(IGovernor).interfaceId ^
        this.castVoteWithReasonAndParams.selector ^
        this.castVoteWithReasonAndParamsBySig.selector ^
        this.getVotesWithParams.selector) ||
        interfaceId == type(IAccessControl).interfaceId || //from AccessControl
        super.supportsInterface(interfaceId);
    }

    function name() public view override returns (string memory) {
        return m_name;
    }
    function symbol() public view returns (string memory) {
        return m_symbol;
    }
    function getCurrentVersion () public view returns (string memory) {
        return m_implementation_version[m_implementation_version.length - 1];
    }
    function getVersionHistory () public view returns (string[] memory) {
        return m_implementation_version;
    }

    function setNativeToken (address token) public onlyRole(MINTER_ROLE) {
        require (token != address(0), "Address should be valid");
        m_token = IERC777Wrapper(token);
        emit NativeTokenSet(token);
    }
    function setNFTCatalog (address nft_catalog) public onlyRole(MINTER_ROLE) {
        require (nft_catalog != address(0), "Address should be valid");
        m_nft_catalog = INFTCatalog(nft_catalog);
        emit NFTCatalogSet(nft_catalog);
    }
    function setProjectCatalog (address project_catalog) public onlyRole(MINTER_ROLE) {
        require (project_catalog != address(0), "Address should be valid");
        m_project_catalog = IProjectCatalog(project_catalog);
        emit ProjectCatalogSet(project_catalog);
    }
    function setNFTOwnership (address nft_ownership) public onlyRole(MINTER_ROLE) {
        require (nft_ownership != address(0), "no address");
        m_nft_ownership = INFTOwnership(nft_ownership);
        emit NFTOwnershipSet(nft_ownership);
    }


    /**
 * @dev See {IGovernor-propose}.
     */

    function propose(
        uint256 project_id,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override isSetupOk returns (uint256) {
        if (project_id != 0){
            NFTStructs.NFT memory project = m_nft_catalog.getNFT(project_id);
            require (project._type == NFTStructs.NftType.Project, "Can't propose for a non-Project");
            require (m_project_catalog.projectExists(project_id), "Project is not active");
            require (m_nft_ownership.isOwner(msg.sender, project_id), "Only project owner can propose");
        }
        uint256 proposalId = hashProposal(project_id, targets, values, calldatas, keccak256(bytes(description)));

        require(
            getVotes(msg.sender, block.number - 1, project_id) >= proposalThreshold(),
            "Governor: proposer votes below proposal threshold"
        );
        require(targets.length == values.length, "Governor: invalid proposal length");
        require(targets.length == calldatas.length, "Governor: invalid proposal length");
        require(targets.length > 0, "Governor: empty proposal");

        ProposalCore storage proposal = _proposals[proposalId];
        require(Timers.isUnset(proposal.voteStart), "Governor: proposal already exists");

        m_proposal_to_project[proposalId] = project_id;
        _storeProposal(_msgSender(), project_id, targets, values, new string[](calldatas.length), calldatas, description);

        uint64 snapshot = SafeCast.toUint64(block.number) + SafeCast.toUint64(votingDelay());
        uint64 deadline = snapshot + SafeCast.toUint64(votingPeriod());

        Timers.setDeadline(proposal.voteStart, snapshot);
        Timers.setDeadline(proposal.voteEnd, deadline);

        emit ProposalCreated(
            proposalId,
            project_id,
            msg.sender,
            targets,
            values,
            new string[](targets.length),
            calldatas,
            snapshot,
            deadline,
            description
        );
        return proposalId;
    }

    function propose(
        uint256 project_id,
        address[] memory targets,
        string[] memory signatures,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override isSetupOk returns (uint256) {
        require(signatures.length == calldatas.length, "Governor: invalid signatures length");

        if (project_id != 0){
            NFTStructs.NFT memory project = m_nft_catalog.getNFT(project_id);
            require (project._type == NFTStructs.NftType.Project, "Can't propose for a non-Project");
            require (m_project_catalog.projectExists(project_id), "Project is not active");
            require (m_nft_ownership.isOwner(msg.sender, project_id), "Only project owner can propose");
        }
        uint256 proposalId = hashProposal(project_id, targets, values, calldatas, keccak256(bytes(description)));

        require(
            getVotes(msg.sender, block.number - 1, project_id) >= proposalThreshold(),
            "Governor: proposer votes below proposal threshold"
        );
        require(targets.length == values.length, "Governor: invalid proposal length");
        require(targets.length == calldatas.length, "Governor: invalid proposal length");
        require(targets.length > 0, "Governor: empty proposal");

        ProposalCore storage proposal = _proposals[proposalId];
        require(Timers.isUnset(proposal.voteStart), "Governor: proposal already exists");

        m_proposal_to_project[proposalId] = project_id;
        _storeProposal(_msgSender(), project_id, targets, values, signatures, calldatas, description);

        uint64 snapshot = SafeCast.toUint64(block.number) + SafeCast.toUint64(votingDelay());
        uint64 deadline = snapshot + SafeCast.toUint64(votingPeriod());

        Timers.setDeadline(proposal.voteStart, snapshot);
        Timers.setDeadline(proposal.voteEnd, deadline);

        emit ProposalCreated(
            proposalId,
            project_id,
            msg.sender,
            targets,
            values,
            new string[](targets.length),
            calldatas,
            snapshot,
            deadline,
            description
        );

        return proposalId;
    }
}
