// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

//import "@openzeppelin/contracts/governance/Governor.sol";
//import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
//import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
//import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../GovernorCore/GovernorCore.sol";
import "../GovernorCore/GovernorSettings.sol";
import "../GovernorCore/GovernorCountingSimple.sol";
import "../GovernorCore/GovernorVotesQuorumFraction.sol";


contract HWL_Governor is GovernorCore, GovernorSettings, GovernorCountingSimple, GovernorVotesQuorumFraction, AccessControl {


    constructor(IGovernanceToken _token)
    GovernorCore("HollywoodLand Governor")
    GovernorSettings(1 /* 1 block */, 45818 /* 1 week */, 0)
    GovernorVotesQuorumFraction(4, _token)
    {
        m_governance_token = _token;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(GovernorCore, AccessControl) returns (bool) {
        // In addition to the current interfaceId, also support previous version of the interfaceId that did not
        // include the castVoteWithReasonAndParams() function as standard
        return
        interfaceId ==
        (type(IGovernor).interfaceId ^
        this.castVoteWithReasonAndParams.selector ^
        this.castVoteWithReasonAndParamsBySig.selector ^
        this.getVotesWithParams.selector) ||
        interfaceId == type(IGovernor).interfaceId ||
        interfaceId == type(IERC1155Receiver).interfaceId ||
        interfaceId == type(IAccessControl).interfaceId || //from AccessControl
        super.supportsInterface(interfaceId);
    }


    function setERC777 (address token) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require (token != address(0), "Address should be valid");
        m_token = IERC777Wrapper(token);
        emit ERC777Set(token);
    }
    function setNftCatalog (address nft_catalog) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require (nft_catalog != address(0), "Address should be valid");
        m_nft_catalog = INFTCatalog(nft_catalog);
        emit NFTCatalogSet(nft_catalog);
    }
    function setProjectCatalog (address project_catalog) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require (project_catalog != address(0), "Address should be valid");
        m_project_catalog = IProjectCatalog(project_catalog);
        emit ProjectCatalogSet(project_catalog);
    }



    function votingDelay()
    public
    view
    override(GovernorSettings)
    returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
    public
    view
    override(GovernorSettings)
    returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
    public
    view
    override(GovernorCore, GovernorVotesQuorumFraction)
    returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
    public
    view
    override (GovernorCore, GovernorSettings)
    returns (uint256)
    {
        return super.proposalThreshold();
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
    ) public override (GovernorCore) returns (uint256) {

        if (project_id != 0){
            NFTStructs.NFT memory project = m_nft_catalog.getNFT(project_id);
            require (project._type == NFTStructs.NftType.Project, "Can't propose for a non-Project");
            require (m_project_catalog.projectExists(project_id), "Project is not active");
        }

        require(
            getVotes(_msgSender(), block.number - 1, project_id) >= proposalThreshold(),
            "Governor: proposer votes below proposal threshold"
        );

        uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

        m_proposal_to_project[proposalId] = project_id; //todo: check that this is enough

        require(targets.length == values.length, "Governor: invalid proposal length");
        require(targets.length == calldatas.length, "Governor: invalid proposal length");
        require(targets.length > 0, "Governor: empty proposal");

        ProposalCore storage proposal = _proposals[proposalId];
        require(Timers.isUnset(proposal.voteStart), "Governor: proposal already exists");

        uint64 snapshot = SafeCast.toUint64(block.number) + SafeCast.toUint64(votingDelay());
        uint64 deadline = snapshot + SafeCast.toUint64(votingPeriod());

        Timers.setDeadline(proposal.voteStart,snapshot);
        Timers.setDeadline(proposal.voteEnd,deadline);

        emit ProposalCreated(
            proposalId,
            _msgSender(),
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


    /**
  * @dev Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
     * voting weight using {IGovernor-getVotes} and call the {_countVote} internal function.
     *
     * Emits a {IGovernor-VoteCast} event.
     */
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal virtual override (GovernorCore) returns (uint256) {
        ProposalCore storage proposal = _proposals[proposalId];
        require(state(proposalId) == GovernorStructs.ProposalState.Active, "Governor: vote not currently active");

        uint256 project_id = m_proposal_to_project[proposalId]; //new line
        uint256 weight = _getVotes(account, Timers.getDeadline(proposal.voteStart), params, project_id);
        _countVote(proposalId, account, support, weight, params);

        if (params.length == 0) {
            emit VoteCast(account, proposalId, support, weight, reason);
        } else {
            emit VoteCastWithParams(account, proposalId, support, weight, reason, params);
        }

        return weight;
    }


    /**
 * @dev
  * Read the voting weight from the token's built in snapshot mechanism (see {Governor-_getVotes}).
  * added project_id as an argument
 */
    function _getVotes(
        address account,
        uint256 blockNumber,
        bytes memory /*params*/,
        uint256 project_id
    ) internal view virtual override (GovernorCore) returns (uint256) {
        return m_governance_token.getPastVotes(account, blockNumber, project_id);
    }

}
