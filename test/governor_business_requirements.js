/**
 * @details
 * Mostly, this is a copy-paste from OZ tests for their Governor,
 * but implemented with slight modifications, caused by a fact that
 * there should be proposals of different levels - for projects and system-wide.
 * No change a business logic, but that discrepancy exists for accounting purpose.
 **/


const { expectEvent, expectRevert, singletons, constants, BN, bignumber, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect, assert} = require('chai');
const { should } = require('chai').should();

// const {concatSig} = require("eth-sig-util");
// const ethSigUtil = require("eth-sig-util");
// const {fromRpcSig} = require("ethereumjs-util");
// const {default: Wallet} = require("ethereumjs-wallet");

const Enums = require("./OpenZeppelinGovernance/enums");
const {EIP712Domain} = require("./OpenZeppelinGovernance/eip712");
const { GovernorHelper } = require('./OpenZeppelinGovernance/governance');

const {
    shouldSupportInterfaces,
} = require('./OpenZeppelinGovernance/SupportsInterface.behavior');


const TokenProxy = artifacts.require('TokenProxy');
const TokenImplementation = artifacts.require('TokenImplementation');
const PriceOracle = artifacts.require('PriceOracle');

const NFTCatalogProxy = artifacts.require('NFTCatalogProxy');
const NFTCatalogImplementation = artifacts.require('NFTCatalogImplementation');
const NFTOwnershipImplementation = artifacts.require('NFTOwnershipImplementation');
const NFTOwnershipProxy = artifacts.require('NFTOwnershipProxy');
const NFT_TransactionPool_Implementation = artifacts.require('NFT_TransactionPool_Implementation');
const NFT_TransactionPoolProxy = artifacts.require('NFT_TransactionPoolProxy');

const ProjectCatalogProxy = artifacts.require('ProjectCatalogProxy');
const ProjectCatalogImplementation = artifacts.require('ProjectCatalogImplementation');

const DebtManagerProxy = artifacts.require('DebtManagerProxy');
const DebtManagerImplementation = artifacts.require('DebtManagerImplementation');
const RevenuesManagerProxy = artifacts.require('RevenuesManagerProxy');
const RevenuesManagerImplementation = artifacts.require('RevenuesManagerImplementation');
const StakesManagerProxy = artifacts.require('StakesManagerProxy');
const StakesManagerImplementation = artifacts.require('StakesManagerImplementation');

const GovernanceTokenProxy = artifacts.require('GovernanceTokenProxy');
const GovernanceTokenImplementation = artifacts.require('GovernanceTokenImplementation');

const GovernorProxy = artifacts.require('GovernorProxy');
const GovernorImplementation = artifacts.require('GovernorImplementation');

const CallReceiver = artifacts.require('CallReceiverMock');

contract('Governor - BRD', (
    [
        registryFunder
        , deployer_address
        , other_user
        , admin_address
        , minter_address
        , digital_investor
        , owner
        , proposer
        , voter1
        , voter2
        , voter3
        , voter4
        , dummy_address
    ]) => {

    const initialSupply = new BN('10000000000000000000000');
    const maxSupply = new BN('20000000000000000000000');
    const t_name = 'HollywoodLandToken';
    const t_symbol = 'HWLT';
    const token_price = new BN('100');
    const amount = new BN('42');

    const pc_name = 'Hollywood Land Project Catalog';
    const pc_symbol = 'HWLPC';

    const nft_c_name = 'Hollywood Land NFT Catalog';
    const nft_c_symbol = 'HWLNFTC';
    const nft_o_name = 'Hollywood Land NFT Ownership';
    const nft_o_symbol = 'HWLNFTO';
    const nft_t_name = 'Hollywood Land NFT Transaction Pool';
    const nft_t_symbol = 'HWLNFTTP';

    const dm_name = 'Hollywood Land Debt Manager';
    const dm_symbol = 'HWLDM';
    const rm_name = 'Hollywood Land Revenues Manager';
    const rm_symbol = 'HWLRM';
    const sm_name = 'Hollywood Land NFT Stakes Manager';
    const sm_symbol = 'HWLSM';

    const gt_name = 'Hollywood Land Governance Token';
    const gt_symbol = 'HWLGT';

    const gvrn_name = 'HollywoodLand Governor';
    const gvrn_symbol = 'HWLGNR';
    const gvrn_version = '1';

    const empty_bytes = web3.utils.asciiToHex("");

    const SHARES_TOTAL = 100;
    const ZERO_SHARES = 0;
    const INITIAL_TOKEN_BALANCE = 200;
    const PRICE = 1000;
    const TOKENS_TO_VOTING_POWER = 100;
    const value = web3.utils.toWei('1');

    const votingDelay = new BN(4);
    const votingPeriod = new BN(16);
    const proposalThreshold = new BN(0);
    const requiredQuorum = new BN(4);

    before(async () => {
        this.dm_impl = await DebtManagerImplementation.new({from: deployer_address});
        this.dm_proxy = await DebtManagerProxy.new(
            dm_name, dm_symbol,
            this.dm_impl.address,
            admin_address,
            minter_address,
            minter_address, //todo: company account - change that
            minter_address, //todo: funds manager account - change that
            {from: deployer_address});
        this.dm_logic = await DebtManagerImplementation.at(this.dm_proxy.address);
        await this.dm_logic.initialize("1", 1, {from: minter_address});

        this.rm_impl = await RevenuesManagerImplementation.new({from: deployer_address});
        this.rm_proxy = await RevenuesManagerProxy.new(
            rm_name, rm_symbol,
            this.rm_impl.address,
            admin_address,
            minter_address,
            minter_address, //todo: company account - change that
            minter_address, //todo: funds manager account - change that
            {from: deployer_address});
        this.rm_logic = await RevenuesManagerImplementation.at(this.rm_proxy.address);
        await this.rm_logic.initialize("1", 1, {from: minter_address});

        this.sm_impl = await StakesManagerImplementation.new({from: deployer_address});
        this.sm_proxy = await StakesManagerProxy.new(
            sm_name, sm_symbol,
            this.sm_impl.address,
            admin_address,
            minter_address,
            minter_address, //todo: company account - change that
            minter_address, //todo: funds manager account - change that
            {from: deployer_address});
        this.sm_logic = await StakesManagerImplementation.at(this.sm_proxy.address);
        await this.sm_logic.initialize("1", 1, {from: minter_address});

        this.nft_c_impl = await NFTCatalogImplementation.new({from: deployer_address});
        this.nft_c_proxy = await NFTCatalogProxy.new(
            nft_c_name, nft_c_symbol,
            this.nft_c_impl.address,
            admin_address,
            minter_address,
            minter_address, //todo: company account - change that
            {from: deployer_address});
        this.nft_c_logic = await NFTCatalogImplementation.at(this.nft_c_proxy.address);
        await this.nft_c_logic.initialize("1", 1, {from: minter_address});

        this.nft_o_impl = await NFTOwnershipImplementation.new({from: deployer_address});
        this.nft_o_proxy = await NFTOwnershipProxy.new(
            nft_o_name, nft_o_symbol,
            this.nft_o_impl.address,
            admin_address,
            minter_address,
            {from: deployer_address});
        this.nft_o_logic = await NFTOwnershipImplementation.at(this.nft_o_proxy.address);
        await this.nft_o_logic.initialize("1", 1, {from: minter_address});

        this.nft_t_impl = await NFT_TransactionPool_Implementation.new({from: deployer_address});
        this.nft_t_proxy = await NFT_TransactionPoolProxy.new(
            nft_t_name, nft_t_symbol,
            this.nft_t_impl.address,
            admin_address,
            minter_address,
            {from: deployer_address});
        this.nft_t_logic = await NFT_TransactionPool_Implementation.at(this.nft_t_proxy.address);
        await this.nft_t_logic.initialize("1", 1, {from: minter_address});

        this.pc_impl = await ProjectCatalogImplementation.new({from: deployer_address});
        this.pc_proxy = await ProjectCatalogProxy.new(
            pc_name, pc_symbol,
            this.pc_impl.address,
            admin_address,
            minter_address,
            minter_address, //todo: company account - change that
            minter_address, //todo: project manager account - change that
            {from: deployer_address});
        this.pc_logic = await ProjectCatalogImplementation.at(this.pc_proxy.address);
        await this.pc_logic.initialize("1", 1, {from: minter_address});

        this.gt_impl = await GovernanceTokenImplementation.new({from: deployer_address});
        this.gt_proxy = await GovernanceTokenProxy.new(
            gt_name, gt_symbol,
            this.gt_impl.address,
            admin_address,
            minter_address,
            minter_address, //todo: company account - change that
            {from: deployer_address});
        this.gt_logic = await GovernanceTokenImplementation.at(this.gt_proxy.address);
        await this.gt_logic.initialize("1", 1, {from: minter_address});


        this.gvrn_impl = await GovernorImplementation.new({from: deployer_address});
        this.gvrn_proxy = await GovernorProxy.new(
            gvrn_name, gvrn_symbol,
            this.gvrn_impl.address
            , admin_address
            , minter_address
            , {from: deployer_address});
        this.gvrn_logic = await GovernorImplementation.at(this.gvrn_proxy.address);
        await this.gvrn_logic.initialize(
            "1", 1
            , this.gt_logic.address
            , votingDelay
            , votingPeriod
            , proposalThreshold
            , requiredQuorum
            , {from: minter_address}
        );
        this.receiver = await CallReceiver.new();
        this.helper = new GovernorHelper(this.gvrn_logic);
        this.chainId = await web3.eth.getChainId();


        this.erc1820 = await singletons.ERC1820Registry(registryFunder);
        this.impl1 = await TokenImplementation.new({from: deployer_address});
        this.token_proxy = await TokenProxy.new(
            t_name, t_symbol, maxSupply,
            this.impl1.address,
            admin_address,
            minter_address,
            {from: deployer_address});
        this.token_logic = await TokenImplementation.at(this.token_proxy.address);
        await this.token_logic.initialize(
            "1", 1,
            [this.dm_logic.address, this.sm_logic.address, this.nft_c_logic.address, this.gt_logic.address, this.gvrn_logic.address], //default Operators
            initialSupply,
            {from: minter_address});
        this.price_oracle = await PriceOracle.new(minter_address, {from: deployer_address});
        await this.price_oracle.setPrice(token_price, {from: minter_address});
        await this.token_logic.setPriceOracle(this.price_oracle.address, {from: minter_address});


        await this.nft_c_logic.setNFTOwnership(this.nft_o_logic.address, {from: minter_address});
        await this.nft_c_logic.setNFT_TransactionPool(this.nft_t_logic.address, {from: minter_address});
        await this.nft_t_logic.setNFTOwnership(this.nft_o_logic.address, {from: minter_address});
        await this.nft_t_logic.setNFTCatalog(this.nft_c_logic.address, {from: minter_address});
        await this.nft_o_logic.setNFT_TransactionPool(this.nft_t_logic.address, {from: minter_address});
        await this.nft_o_logic.setNFTCatalog(this.nft_c_logic.address, {from: minter_address});

        await this.nft_c_logic.setProjectCatalog(this.pc_logic.address, {from: minter_address});
        await this.nft_c_logic.setDebtManager(this.dm_logic.address, {from: minter_address});
        await this.nft_c_logic.setRevenuesManager(this.rm_logic.address, {from: minter_address});
        await this.nft_c_logic.setStakesManager(this.sm_logic.address, {from: minter_address});
        await this.nft_c_logic.setNativeToken(this.token_logic.address, {from: minter_address});
        await this.nft_c_logic.setGovernanceToken(this.gt_logic.address, {from: minter_address});

        await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from: minter_address});
        await this.nft_o_logic.setDebtManager(this.dm_logic.address, {from: minter_address});
        await this.nft_o_logic.setRevenuesManager(this.rm_logic.address, {from: minter_address});
        await this.nft_o_logic.setStakesManager(this.sm_logic.address, {from: minter_address});
        await this.nft_o_logic.setGovernanceToken(this.gt_logic.address, {from: minter_address});

        await this.dm_logic.setNativeToken(this.token_logic.address, {from: minter_address});
        await this.dm_logic.setNFTCatalog(this.nft_c_logic.address, {from: minter_address});
        await this.dm_logic.setNFTOwnership(this.nft_o_logic.address, {from: minter_address});
        await this.dm_logic.setProjectCatalog(this.pc_logic.address, {from: minter_address});

        await this.rm_logic.setNativeToken(this.token_logic.address, {from: minter_address});
        await this.rm_logic.setNFTCatalog(this.nft_c_logic.address, {from: minter_address});
        await this.rm_logic.setNFTOwnership(this.nft_o_logic.address, {from: minter_address});
        await this.rm_logic.setProjectCatalog(this.pc_logic.address, {from: minter_address});
        await this.rm_logic.setStakesManager(this.sm_logic.address, {from: minter_address});

        await this.sm_logic.setNativeToken(this.token_logic.address, {from: minter_address});
        await this.sm_logic.setNFTCatalog(this.nft_c_logic.address, {from: minter_address});
        await this.sm_logic.setNFTOwnership(this.nft_o_logic.address, {from: minter_address});
        await this.sm_logic.setProjectCatalog(this.pc_logic.address, {from: minter_address});

        await this.pc_logic.setNFTCatalog(this.nft_c_logic.address, {from: minter_address});
        await this.pc_logic.setNFTOwnership(this.nft_o_logic.address, {from: minter_address});
        await this.pc_logic.setDebtManager(this.dm_logic.address, {from: minter_address});
        await this.pc_logic.setRevenuesManager(this.rm_logic.address, {from: minter_address});
        await this.pc_logic.setStakesManager(this.sm_logic.address, {from: minter_address});


        await this.gt_logic.setNativeToken(this.token_logic.address, {from: minter_address});
        await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from: minter_address});
        await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from: minter_address});
        await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from: minter_address});

        // await this.gvrn_logic.setNativeToken(this.token_logic.address, {from: minter_address});
        // await this.gvrn_logic.setNFTCatalog(this.nft_c_logic.address, {from: minter_address});
        // await this.gvrn_logic.setProjectCatalog(this.pc_logic.address, {from: minter_address});

        await this.pc_logic.createProject(other_user, "Test project1", "Production", "Script", SHARES_TOTAL.toString(), {from: other_user});
        await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});
        await this.pc_logic.createProject(other_user, "Test project2", "Production", "Script", SHARES_TOTAL.toString(), {from: other_user});
        await this.pc_logic.registerProjectBudget(other_user, "2", "1000", "3500", {from: other_user});


        await this.token_logic.setAddressRegistered(other_user, true, {from: minter_address});
        await this.token_logic.setAddressRegistered(digital_investor, true, {from: minter_address});
        await this.token_logic.setAddressRegistered(proposer, true, {from: minter_address});
        await this.token_logic.setAddressRegistered(owner, true, {from: minter_address});
        await this.token_logic.setAddressRegistered(voter1, true, {from: minter_address});
        await this.token_logic.setAddressRegistered(voter2, true, {from: minter_address});
        await this.token_logic.setAddressRegistered(voter3, true, {from: minter_address});
        await this.token_logic.setAddressRegistered(voter4, true, {from: minter_address});

        let updated_amount = await web3.utils.fromWei(new BN(TOKENS_TO_VOTING_POWER), 'wei');
        await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
        await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});
        await this.token_logic.fromEtherToTokens(proposer, {from: proposer, value: updated_amount});
        await this.token_logic.fromEtherToTokens(owner, {from: owner, value: updated_amount});
        await this.token_logic.fromEtherToTokens(voter1, {from: voter1, value: updated_amount});
        await this.token_logic.fromEtherToTokens(voter2, {from: voter2, value: updated_amount});
        await this.token_logic.fromEtherToTokens(voter3, {from: voter3, value: updated_amount});
        await this.token_logic.fromEtherToTokens(voter4, {from: voter4, value: updated_amount * 1000});


        await this.gt_logic.depositTokens(owner, "10", 0, {from: owner});
        await this.gt_logic.depositTokens(voter1, "7", 0, {from: voter1});
        await this.gt_logic.depositTokens(voter2, "5", 0, {from: voter2});
        await this.gt_logic.depositTokens(voter3, "2", 0, {from: voter3});
        await this.gt_logic.depositTokens(voter4, "1", 0, {from: voter4});
        await this.gt_logic.depositTokens(voter4, "100", "2", {from: voter4});

    });
    it('deployment: checking the addresses are different', async () => {
        assert.isFalse(minter_address == admin_address);
        assert.isFalse(minter_address == deployer_address);
        assert.isFalse(minter_address == other_user);
        assert.isFalse(admin_address == deployer_address);
        assert.isFalse(admin_address == other_user);
        assert.isFalse(deployer_address == other_user);
    });
    it('deployment: checking deployment was ok', async () => {
        assert.equal(await this.token_logic.name({from: other_user}), t_name, "Token name is not correct");
        assert.equal(await this.token_logic.symbol({from: other_user}), t_symbol, "Token symbol is not correct");
        assert.equal(await this.token_logic.getCurrentVersion({from: other_user}), "1", "current nft transaction pool version should be 1");
        assert.equal(await this.gt_logic.name({from: other_user}), gt_name, "GT name is not correct");
        assert.equal(await this.gt_logic.symbol({from: other_user}), gt_symbol, "GT symbol is not correct");
        assert.equal(await this.gt_logic.getCurrentVersion({from: other_user}), "1", "current nft transaction pool version should be 1");
        assert.equal(await this.gvrn_logic.name({from: other_user}), "HollywoodLand Governor", "You should check initialization, Governor name is not correct");
        assert.equal(await this.gvrn_logic.symbol({from: other_user}), "HWLGNR", "You should check initialization, Governor symbol is not correct");
    });
    it('deployment: Governor setup check', async () => {
        expect(await this.gvrn_logic.votingDelay()).to.be.bignumber.equal(votingDelay);
        expect(await this.gvrn_logic.votingPeriod()).to.be.bignumber.equal(votingPeriod);
        expect(await this.gvrn_logic.quorum(0)).to.be.bignumber.equal('0');
        expect(await this.gvrn_logic.COUNTING_MODE()).to.be.equal('support=bravo&quorum=for,abstain');
    });
    it('deployment: make proposal', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "System-wide proposal 1st");
    });

    it('deployment: Governor reverting on incomplete setup', async () => {
        await expectRevert(this.helper.propose({from: proposer})
            , "Setup is not ok Governor");
    });
    it('deployment: Governor reverting on unauthorised setting up NFT Catalog', async () => {
        await expectRevert.unspecified(
            this.gvrn_logic.setNFTCatalog(this.nft_c_logic.address, {from: deployer_address}));
    });
    it('deployment: Governor setting up NFT Catalog', async () => {
        let txResult = await this.gvrn_logic.setNFTCatalog(this.nft_c_logic.address, {from: minter_address});
        const {logs} = txResult;
        expectEvent.inLogs(logs, 'NFTCatalogSet', {
            nft_catalog: this.nft_c_logic.address,
        });
    });
    it('deployment: Governor reverting on unauthorised setting up ProjectCatalog', async () => {
        await expectRevert.unspecified(
            this.gvrn_logic.setProjectCatalog(this.pc_logic.address, {from: deployer_address}));
    });
    it('deployment: Governor setting up ProjectCatalog', async () => {
        let txResult = await this.gvrn_logic.setProjectCatalog(this.pc_logic.address, {from: minter_address});
        const {logs} = txResult;
        expectEvent.inLogs(logs, 'ProjectCatalogSet', {
            project_catalog: this.pc_logic.address,
        });
    });
    it('deployment: Governor reverting on unauthorised setting up NativeToken', async () => {
        await expectRevert.unspecified(
            this.gvrn_logic.setNativeToken(this.token_logic.address, {from: deployer_address}));
    });
    it('deployment: Governor setting up NativeToken', async () => {
        let txResult = await this.gvrn_logic.setNativeToken(this.token_logic.address, {from: minter_address});
        const {logs} = txResult;
        expectEvent.inLogs(logs, 'NativeTokenSet', {
            token: this.token_logic.address,
        });
    });
    it('deployment: Governor check that setup is complete', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "System-wide proposal 2nd");

        const txResult = await this.helper.propose({from: proposer});
        const {logs} = txResult;
        expectEvent.inLogs(logs, 'ProposalCreated', {
            proposer: proposer,
            targets: [this.receiver.address],
            // values: [this.proposal.values],
            signatures: [""],
            calldatas: [this.receiver.contract.methods.mockFunction().encodeABI()],
            startBlock: new BN(txResult.receipt.blockNumber).add(votingDelay),
            endBlock: new BN(txResult.receipt.blockNumber).add(votingDelay).add(votingPeriod),
            description: "System-wide proposal 2nd"
        });
    });

    it('voting: make proposal', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "System-wide proposal 3rd");

        const txResult = await this.helper.propose({from: proposer});
        const {logs} = txResult;
        expectEvent.inLogs(logs, 'ProposalCreated', {
            projectId: "0",
            proposer: proposer,
            targets: [this.receiver.address],
            // values: [this.proposal.values],
            signatures: [""],
            calldatas: [this.receiver.contract.methods.mockFunction().encodeABI()],
            startBlock: new BN(txResult.receipt.blockNumber).add(votingDelay),
            endBlock: new BN(txResult.receipt.blockNumber).add(votingDelay).add(votingPeriod),
            description: "System-wide proposal 3rd"
        });
    });
    it('voting: checking proposal state before voting period started', async () => {
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Pending);
    });
    it('voting: checking this proposal has not been voted before', async () => {
        expect(await this.gvrn_logic.hasVoted(this.proposal.id, owner)).to.be.equal(false);
        expect(await this.gvrn_logic.hasVoted(this.proposal.id, voter1)).to.be.equal(false);
        expect(await this.gvrn_logic.hasVoted(this.proposal.id, voter2)).to.be.equal(false);
        expect(await this.gvrn_logic.hasVoted(this.proposal.id, voter3)).to.be.equal(false);
        expect(await this.gvrn_logic.hasVoted(this.proposal.id, voter4)).to.be.equal(false);
    });
    it('voting: checking the balances before proposal', async () => {
        expect(await web3.eth.getBalance(this.gvrn_logic.address)).to.be.bignumber.equal('0');
        expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal('0');

        await web3.eth.sendTransaction({from: owner, to: this.gvrn_logic.address, value});

        expect(await web3.eth.getBalance(this.gvrn_logic.address)).to.be.bignumber.equal(value);
        expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal('0');
    });
    it('voting: normal workflow - voting', async () => {

        await this.helper.waitForSnapshot();

        expectEvent(
            await this.helper.vote({support: Enums.VoteType.For, reason: 'This is nice'}, {from: voter1}),
            'VoteCast',
            {
                voter: voter1,
                support: Enums.VoteType.For,
                reason: 'This is nice',
                weight: '7',
            },
        );

        expectEvent(
            await this.helper.vote({support: Enums.VoteType.For}, {from: voter2}),
            'VoteCast',
            {
                voter: voter2,
                support: Enums.VoteType.For,
                weight: '5',
            },
        );

        expectEvent(
            await this.helper.vote({support: Enums.VoteType.Against}, {from: voter3}),
            'VoteCast',
            {
                voter: voter3,
                support: Enums.VoteType.Against,
                weight: '2',
            },
        );

        expectEvent(
            await this.helper.vote({support: Enums.VoteType.Abstain}, {from: voter4}),
            'VoteCast',
            {
                voter: voter4,
                support: Enums.VoteType.Abstain,
                weight: '1',
            },
        );
    });
    it('voting: checking proposal state after voting period started', async () => {
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
    });
    it('voting: checking this proposal has been voted', async () => {
        expect(await this.gvrn_logic.hasVoted(this.proposal.id, owner)).to.be.equal(false);
        expect(await this.gvrn_logic.hasVoted(this.proposal.id, voter1)).to.be.equal(true);
        expect(await this.gvrn_logic.hasVoted(this.proposal.id, voter2)).to.be.equal(true);
        expect(await this.gvrn_logic.hasVoted(this.proposal.id, voter3)).to.be.equal(true);
        expect(await this.gvrn_logic.hasVoted(this.proposal.id, voter4)).to.be.equal(true);
    });
    it('voting: checking proposal state after voting period ended', async () => {
        await this.helper.waitForDeadline();
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);
    });
    it('voting: normal workflow - execution', async () => {
        const txExecute = await this.helper.execute();

        expectEvent(
            txExecute,
            'ProposalExecuted',
            {proposalId: this.proposal.id},
        );

        await expectEvent.inTransaction(
            txExecute.tx,
            this.receiver,
            'MockFunctionCalled',
        );
    });
    it('voting: checking the balances after proposal executed', async () => {
        expect(await web3.eth.getBalance(this.gvrn_logic.address)).to.be.bignumber.equal('0');
        expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal(value);

    });
    it('voting: checking proposal state after proposal executed', async () => {
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Executed);
    });
    it('voting: vote with signature - vote proposal, execute proposal', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "System-wide proposal 4th");

        await web3.eth.accounts.wallet.create(1);
        const voterBySig = await web3.eth.accounts.wallet[0];

        const signature = async (message) => {
            return web3.eth.accounts.sign(
                {
                    data: {
                        types: {
                            EIP712Domain,
                            Ballot: [
                                {name: 'proposalId', type: 'uint256'},
                                {name: 'support', type: 'uint8'},
                            ],
                        },
                        domain: {
                            name: gvrn_name,
                            version: gvrn_version,
                            chainId: this.chainId,
                            verifyingContract: this.gvrn_logic.address
                        },
                        primaryType: 'Ballot',
                        message,
                    },
                },
                voterBySig.privateKey
            );
        };

        await this.gt_logic.delegate(voterBySig.address, 0, {from: voter1});

        // Run proposal
        await this.helper.propose();
        await this.helper.waitForSnapshot();

        expectEvent(
            await this.helper.vote({support: Enums.VoteType.For, reason: 'This is nice'}, {from: voter2}),
            'VoteCast',
            {
                voter: voter2,
                support: Enums.VoteType.For,
                reason: 'This is nice',
                weight: '5',
            },
        );
        expectEvent(
            await this.helper.vote({support: Enums.VoteType.For, signature}),
            'VoteCast',
            {
                // voter: voterBySig.address,
                support: Enums.VoteType.For
            },
        );

        await this.helper.waitForDeadline();
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);
        await web3.eth.sendTransaction({from: owner, to: this.gvrn_logic.address, value});
        await this.helper.execute();

        // After voting period is over
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Executed);
    });

    it('revert: vote - if proposal does not exist', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "System-wide proposal 5th");
        await expectRevert(
            this.helper.vote({support: Enums.VoteType.For}, {from: voter1}),
            'Governor: unknown proposal id',
        );
    });
    it('revert: execute - if proposal does not exist', async () => {
        await expectRevert(this.helper.execute(), 'Governor: unknown proposal id');
    });
    it('revert: propose for a project - if project doesn\'t exist', async () => {
        this.proposal = this.helper.setProposal(
            42,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "Proposal for non-existing project");
        await expectRevert.unspecified(
            this.helper.propose()
        );
    });
    it('revert: setting up system-wide proposal', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "System-wide proposal 6th");
    });
    it('revert: vote - if voting has not started', async () => {
        await this.helper.propose();
        await expectRevert(
            this.helper.vote({support: Enums.VoteType.For}, {from: voter1}),
            'Governor: vote not currently active',
        );
    });
    it('revert: propose - if proposal already exists', async () => {
        await expectRevert(this.helper.propose(), 'Governor: proposal already exists');
    });
    it('revert: vote - if support value is invalid', async () => {
        await this.helper.waitForSnapshot();
        await expectRevert(
            this.helper.vote({support: new BN('255')}),
            'GovernorVotingSimple: invalid value for enum VoteType',
        );
    });
    it('revert: vote - if vote was already casted', async () => {
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await expectRevert(
            this.helper.vote({support: Enums.VoteType.For}, {from: voter1}),
            'GovernorVotingSimple: vote already cast',
        );
    });
    it('revert: vote - if governance tokens are allocated for another project', async () => {
        this.proposal = this.helper.setProposal(
            1,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "Proposal for non-existing project");
        await expectRevert.unspecified(
            this.helper.vote({support: Enums.VoteType.For, reason: 'This is nice'}, {from: voter4})
        );
    });
    it('revert: execute - if voting is not over', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "System-wide proposal 42nd");
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
    });
    it('revert: vote - if voting is over', async () => {
        await this.helper.waitForDeadline();
        await expectRevert(
            this.helper.vote({support: Enums.VoteType.For}, {from: voter1}),
            'Governor: vote not currently active',
        );
    });
    it('revert: execute if score not reached', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], '<proposal description>');

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.vote({support: Enums.VoteType.Against}, {from: voter2});
        await this.helper.waitForDeadline();
        await expectRevert(this.helper.execute(), 'Governor: call reverted without message');
    });
    it('revert: execute - if quorum is not reached', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], 'System-wide proposal 7th');

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter3});
        await this.helper.waitForDeadline();
        await expectRevert.unspecified(this.helper.execute());
    });
    it('revert: if receiver revert without reason', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [{
                target: this.receiver.address,
                data: this.receiver.contract.methods.mockFunctionRevertsNoReason().encodeABI(),
            },
            ], 'System-wide proposal 8th');

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter2});
        await this.helper.waitForDeadline();
        await expectRevert(this.helper.execute(), 'Governor: call reverted without message');
    });
    it('revert: if receiver revert with reason', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunctionRevertsReason().encodeABI(),
                },
            ], 'System-wide proposal 9th');

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter2});
        await this.helper.waitForDeadline();
        await expectRevert(this.helper.execute(), 'CallReceiverMock: reverting');
    });
    it('revert: if proposal was already executed', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                },
            ], 'System-wide proposal 10th');
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter2});
        await this.helper.waitForDeadline();
        await this.helper.execute();
        await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
    });

    it('state: make proposal', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "System-wide proposal 11th");
    });
    it('state: Unset', async () => {
        await expectRevert(this.gvrn_logic.state(this.proposal.id), 'Governor: unknown proposal id');
    });
    it('state: Pending & Active', async () => {
        await this.helper.propose();
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Pending);
        await this.helper.waitForSnapshot();
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Pending);
        await this.helper.waitForSnapshot(+1);
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
    });
    it('state: Defeated', async () => {
        // await this.helper.waitForDeadline();
        // expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
        await this.helper.waitForDeadline(+1);
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Defeated);
    });
    it('state: Succeeded', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], 'System-wide proposal 13th');
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter2});
        // await this.helper.waitForDeadline();
        // expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
        await this.helper.waitForDeadline(+1);
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);
    });
    it('state: Executed', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], 'System-wide proposal 14th');
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter2});
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter3});
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter4});
        await this.helper.waitForDeadline(+1);
        await web3.eth.sendTransaction({from: owner, to: this.gvrn_logic.address, value});
        await this.helper.execute();
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Executed);
    });

    it('cancel: make proposal', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], "System-wide proposal 14.1th");
    });
    it('cancel: before proposal', async () => {
        await expectRevert(this.helper.cancel(), 'Governor: proposer above threshold');
    });
    it('cancel: after proposal', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], 'System-wide proposal 15th');
        await this.helper.propose();

        await this.helper.cancel();
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

        await this.helper.waitForSnapshot();
        await expectRevert(
            this.helper.vote({support: Enums.VoteType.For}, {from: voter1}),
            'Governor: vote not currently active',
        );
    });
    it('cancel: after vote', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], 'System-wide proposal 16th');
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});

        await this.helper.cancel();
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

        await this.helper.waitForDeadline();
        await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
    });
    it('cancel: after deadline', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], 'System-wide proposal 17th');
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.waitForDeadline();

        await this.helper.cancel();
        expect(await this.gvrn_logic.state(this.proposal.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

        await expectRevert(this.helper.execute(), 'Governor: proposal not successful');
    });
    it('cancel: after execution', async () => {
        this.proposal = this.helper.setProposal(
            0,
            [
                {
                    target: this.receiver.address,
                    data: this.receiver.contract.methods.mockFunction().encodeABI(),
                    value,
                },
            ], 'System-wide proposal 18th');
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.waitForDeadline();
        await web3.eth.sendTransaction({from: owner, to: this.gvrn_logic.address, value});
        await this.helper.execute();

        await expectRevert(this.helper.cancel(), 'Governor: proposal not active');
    });

    it('length: empty', async () => {
        this.helper.setProposal(0, [], '<proposal description>');
        await expectRevert(this.helper.propose(), 'Governor: empty proposal');
    });
    it('length: missmatch #1', async () => {
        this.helper.setProposal(0, {
            targets: [],
            values: [web3.utils.toWei('0')],
            data: [this.receiver.contract.methods.mockFunction().encodeABI()],
        }, '<proposal description>');
        await expectRevert(this.helper.propose(), 'Governor: invalid proposal length');
    });
    it('length: missmatch #2', async () => {
        this.helper.setProposal(0, {
            targets: [this.receiver.address],
            values: [],
            data: [this.receiver.contract.methods.mockFunction().encodeABI()],
        }, '<proposal description>');
        await expectRevert(this.helper.propose(), 'Governor: invalid proposal length');
    });
    it('length: missmatch #3', async () => {
        this.helper.setProposal(0, {
            targets: [this.receiver.address],
            values: [web3.utils.toWei('0')],
            data: [],
        }, '<proposal description>');
        await expectRevert(this.helper.propose(), 'Governor: invalid proposal length');
    });

    it('onlygovernance: setVotingDelay is protected', async () => {
        await expectRevert(this.gvrn_logic.setVotingDelay('0'), 'Governor: onlyGovernance');
    });
    it('onlygovernance: setVotingPeriod is protected', async () => {
        await expectRevert(this.gvrn_logic.setVotingPeriod('32'), 'Governor: onlyGovernance');
    });
    it('onlygovernance: setProposalThreshold is protected', async () => {
        await expectRevert(this.gvrn_logic.setProposalThreshold('1000000000000000000'), 'Governor: onlyGovernance');
    });
    it('onlygovernance: can setVotingDelay through governance', async () => {
        this.helper.setProposal(0, [
            {
                target: this.gvrn_logic.address,
                data: this.gvrn_logic.contract.methods.setVotingDelay('0').encodeABI(),
            },
        ], '<proposal description>');

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.waitForDeadline();

        expectEvent(
            await this.helper.execute(),
            'VotingDelaySet',
            {oldVotingDelay: '4', newVotingDelay: '0'},
        );

        expect(await this.gvrn_logic.votingDelay()).to.be.bignumber.equal('0');
    });
    it('onlygovernance: can setVotingPeriod through governance', async () => {
        this.helper.setProposal(0, [
            {
                target: this.gvrn_logic.address,
                data: this.gvrn_logic.contract.methods.setVotingPeriod('32').encodeABI(),
            },
        ], '<proposal description>');

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.waitForDeadline();

        expectEvent(
            await this.helper.execute(),
            'VotingPeriodSet',
            {oldVotingPeriod: '16', newVotingPeriod: '32'},
        );

        expect(await this.gvrn_logic.votingPeriod()).to.be.bignumber.equal('32');
    });
    it('onlygovernance: cannot setVotingPeriod to 0 through governance', async () => {
        this.helper.setProposal(0, [
            {
                target: this.gvrn_logic.address,
                data: this.gvrn_logic.contract.methods.setVotingPeriod('0').encodeABI(),
            },
        ], '<proposal description>');

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.waitForDeadline();

        await expectRevert(this.helper.execute(), 'GovernorSettings: voting period too low');
    });
    it('onlygovernance: can setProposalThreshold to 0 through governance', async () => {
        this.helper.setProposal(0, [
            {
                target: this.gvrn_logic.address,
                data: this.gvrn_logic.contract.methods.setProposalThreshold('1000000000000000000').encodeABI(),
            },
        ], '<proposal description>');

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.vote({support: Enums.VoteType.For}, {from: voter1});
        await this.helper.waitForDeadline();

        expectEvent(
            await this.helper.execute(),
            'ProposalThresholdSet',
            {oldProposalThreshold: '0', newProposalThreshold: '1000000000000000000'},
        );

        expect(await this.gvrn_logic.proposalThreshold()).to.be.bignumber.equal('1000000000000000000');
    });
});
