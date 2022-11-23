// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;


import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Timers.sol";

import "./GovernorStructs.sol";

import "../../NFT/Libs/NFTStructs.sol";
import "../../Libs/IERC777Wrapper.sol";
import "../../ProjectCatalog/IProjectCatalog.sol";
import "../../NFT/NFTCatalog/INFTCatalog.sol";
import "../GovernanceToken/IGovernanceToken_.sol";


contract GovernorDataStorage {
    using GovernorStructs for GovernorStructs.ProposalState;

    // ---------- Governor Data Storage ----------
    using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;
    using SafeCast for uint256;
    using Timers for Timers.BlockNumber;

    bytes32 public constant BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");
    bytes32 public constant EXTENDED_BALLOT_TYPEHASH = keccak256("ExtendedBallot(uint256 proposalId,uint8 support,string reason,bytes params)");

    struct ProposalCore {
        Timers.BlockNumber voteStart;
        Timers.BlockNumber voteEnd;
        bool executed;
        bool canceled;
    }

    string internal _name;

    mapping(uint256 => ProposalCore) internal _proposals;

    // This queue keeps track of the governor operating on itself. Calls to functions protected by the
    // {onlyGovernance} modifier needs to be whitelisted in this queue. Whitelisting is set in {_beforeExecute},
    // consumed by the {onlyGovernance} modifier and eventually reset in {_afterExecute}. This ensures that the
    // execution of {onlyGovernance} protected calls can only be achieved through successful proposals.
    DoubleEndedQueue.Bytes32Deque internal _governanceCall;
    // -------------------------------------

    // ---------- IGovernor Events ----------

    /**
     * @dev Emitted when a proposal is created.
     */
    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        string description
    );

    /**
     * @dev Emitted when a proposal is canceled.
     */
    event ProposalCanceled(uint256 proposalId);

    /**
     * @dev Emitted when a proposal is executed.
     */
    event ProposalExecuted(uint256 proposalId);

    /**
     * @dev Emitted when a vote is cast without params.
     *
     * Note: `support` values should be seen as buckets. Their interpretation depends on the voting module used.
     */
    event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason);

    /**
     * @dev Emitted when a vote is cast with params.
     *
     * Note: `support` values should be seen as buckets. Their interpretation depends on the voting module used.
     * `params` are additional encoded parameters. Their intepepretation also depends on the voting module used.
     */
    event VoteCastWithParams(
        address indexed voter,
        uint256 proposalId,
        uint8 support,
        uint256 weight,
        string reason,
        bytes params
    );
    // -------------------------------------

    // ---------- User Defined Data and Events ----------


    mapping (uint256 => uint256) m_proposal_to_project;


    IGovernanceToken m_governance_token;
    IERC777Wrapper internal m_token;
    IProjectCatalog internal m_project_catalog;
    INFTCatalog internal m_nft_catalog;

    event ERC777Set(address token);
    event ProjectCatalogSet(address project_catalog);
    event NFTCatalogSet(address nft_catalog);

}
