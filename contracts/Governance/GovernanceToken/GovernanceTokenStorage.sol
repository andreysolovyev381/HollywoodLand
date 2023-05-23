//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../../Libs/ProxyStorage.sol";
import "../../Libs/EternalStorage.sol";
import "../../Libs/IERC777Wrapper.sol";
import "../../ProjectCatalog/IProjectCatalog.sol";
import "../../NFT/NFTCatalog/INFTCatalog.sol";
import "../../NFT/NFTOwnership/INFTOwnership.sol";

import "../../Libs/IterableSet.sol";

contract GovernanceToken_SpecificStorage is ProxyStorage {

    //ERC20 data;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    //ERC20Votes;
    struct Checkpoint {
        uint32 fromBlock;
        uint224 votes;
    }

    bytes32 internal constant _DELEGATION_TYPEHASH =
    keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

    /**
        * @dev
    * this data structure was changed to embrace business requirements
    * new data structure is address -> project_id -> address
    */
    mapping(address => mapping (uint256 => address)) internal _delegates;
    /**
        * @dev
    * this data structure was changed to embrace business requirements
    * new data structure is address -> project_id -> votes
    */
    mapping(address => mapping (uint256 => Checkpoint[])) internal _checkpoints;
    Checkpoint[] internal _totalSupplyCheckpoints;

    /**
 * @dev Emitted when an account changes their delegate.
     * EXTENDED FOR PROJECT ID
     */
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate, uint256 project_id);

    /**
     * @dev Emitted when a token transfer or delegate change results in changes to a delegate's number of votes.
     * EXTENDED FOR PROJECT ID
     */
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance, uint256 project_id);




    //Contract specific data
    struct GovTokens {
        uint256 _tokens_issued;
        uint256 _shares_deposited;
    }

    struct Deposit {
        uint256 _gov_tokens;
        uint256 _gov_tokens_by_native_token;
        //nft_id -> gov tokens issued
        mapping(uint256 => GovTokens) _gov_tokens_by_nfts;
        IterableSet.Set _nfts;
    }
    uint256 constant internal COMMON_ISSUES_UID = 0;

    IERC777Wrapper internal m_token;
    IProjectCatalog internal m_project_catalog;
    INFTCatalog internal m_nft_catalog;
    INFTOwnership internal m_nft_ownership;
    address m_company_account;

    //address -> project -> deposit
    mapping (address => mapping (uint256 => Deposit)) internal m_deposits;

    event NativeTokenSet(address token);
    event ProjectCatalogSet(address project_catalog);
    event NFTCatalogSet(address nft_catalog);
    event NFTOwnershipSet(address nft_ownership);
    event CompanyAccountSet(address company_account);

    event TokensDeposited(address indexed by, uint256 indexed project_id, uint256 indexed volume);
    event TokensWithdrawn(address indexed by, uint256 indexed project_id, uint256 indexed volume);
    event NFTsDeposited(address indexed by, uint256 indexed project_id, uint256 indexed nft_id, uint256 volume);
    event NFTsWithdrawn(address indexed by, uint256 indexed project_id, uint256 indexed nft_id, uint256 volume);

}

contract ExternalGovernanceTokenStorage is GovernanceToken_SpecificStorage, EternalStorage {
}
