const { expectEvent, expectRevert, singletons, constants, BN, bignumber, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect, assert} = require('chai');
const {concatSig} = require("eth-sig-util");
const { should } = require('chai').should();

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


contract('Governor - BRD', ([registryFunder, deployer_address, other_user, admin_address, minter_address, digital_investor]) => {

    const initialSupply = new BN('10000000000000000000000');
    const maxSupply     = new BN('20000000000000000000000');
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

    const empty_bytes = web3.utils.asciiToHex("");

    const SHARES_TOTAL = 100;
    const ZERO_SHARES = 0;
    const INITIAL_TOKEN_BALANCE = 200;
    const PRICE = 1000;
    const TOKENS_TO_VOTING_POWER = 100;


    context.skip('deployment and setup checks', function () {
        before(async () => {
            this.dm_impl = await DebtManagerImplementation.new({from:deployer_address});
            this.dm_proxy = await DebtManagerProxy.new(
                dm_name, dm_symbol,
                this.dm_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                minter_address, //todo: funds manager account - change that
                {from:deployer_address});
            this.dm_logic = await DebtManagerImplementation.at(this.dm_proxy.address);
            await this.dm_logic.initialize("1", {from:minter_address});

            this.rm_impl = await RevenuesManagerImplementation.new({from:deployer_address});
            this.rm_proxy = await RevenuesManagerProxy.new(
                rm_name, rm_symbol,
                this.rm_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                minter_address, //todo: funds manager account - change that
                {from:deployer_address});
            this.rm_logic = await RevenuesManagerImplementation.at(this.rm_proxy.address);
            await this.rm_logic.initialize("1", {from:minter_address});

            this.sm_impl = await StakesManagerImplementation.new({from:deployer_address});
            this.sm_proxy = await StakesManagerProxy.new(
                sm_name, sm_symbol,
                this.sm_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                minter_address, //todo: funds manager account - change that
                {from:deployer_address});
            this.sm_logic = await StakesManagerImplementation.at(this.sm_proxy.address);
            await this.sm_logic.initialize("1", {from:minter_address});

            this.nft_c_impl = await NFTCatalogImplementation.new({from:deployer_address});
            this.nft_c_proxy = await NFTCatalogProxy.new(
                nft_c_name, nft_c_symbol,
                this.nft_c_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                {from:deployer_address});
            this.nft_c_logic = await NFTCatalogImplementation.at(this.nft_c_proxy.address);
            await this.nft_c_logic.initialize("1", {from:minter_address});

            this.nft_o_impl = await NFTOwnershipImplementation.new({from:deployer_address});
            this.nft_o_proxy = await NFTOwnershipProxy.new(
                nft_o_name, nft_o_symbol,
                this.nft_o_impl.address,
                admin_address,
                minter_address,
                {from:deployer_address});
            this.nft_o_logic = await NFTOwnershipImplementation.at(this.nft_o_proxy.address);
            await this.nft_o_logic.initialize("1", {from:minter_address});

            this.nft_t_impl = await NFT_TransactionPool_Implementation.new({from:deployer_address});
            this.nft_t_proxy = await NFT_TransactionPoolProxy.new(
                nft_t_name, nft_t_symbol,
                this.nft_t_impl.address,
                admin_address,
                minter_address,
                {from:deployer_address});
            this.nft_t_logic = await NFT_TransactionPool_Implementation.at(this.nft_t_proxy.address);
            await this.nft_t_logic.initialize("1", {from:minter_address});

            this.pc_impl = await ProjectCatalogImplementation.new({from:deployer_address});
            this.pc_proxy = await ProjectCatalogProxy.new(
                pc_name, pc_symbol,
                this.pc_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                minter_address, //todo: project manager account - change that
                {from:deployer_address});
            this.pc_logic = await ProjectCatalogImplementation.at(this.pc_proxy.address);
            await this.pc_logic.initialize("1", {from:minter_address});

            this.gt_impl = await GovernanceTokenImplementation.new({from:deployer_address});
            this.gt_proxy = await GovernanceTokenProxy.new(
                gt_name, gt_symbol,
                this.gt_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                {from:deployer_address});
            this.gt_logic = await GovernanceTokenImplementation.at(this.gt_proxy.address);
            await this.gt_logic.initialize("1", {from:minter_address});


            this.erc1820 = await singletons.ERC1820Registry(registryFunder);
            this.impl1 = await TokenImplementation.new({from:deployer_address});
            this.token_proxy = await TokenProxy.new(
                t_name, t_symbol, maxSupply,
                this.impl1.address,
                admin_address,
                minter_address,
                {from:deployer_address});
            this.token_logic = await TokenImplementation.at(this.token_proxy.address);
            await this.token_logic.initialize(
                "1",
                [this.dm_logic.address, this.sm_logic.address, this.nft_c_logic.address, this.gt_logic.address], //default Operators
                initialSupply,
                {from:minter_address});
            this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
            await this.price_oracle.setPrice(token_price, {from: minter_address});
            await this.token_logic.setPriceOracle(this.price_oracle.address, {from: minter_address} );


            await this.nft_c_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.nft_c_logic.setNFT_TransactionPool(this.nft_t_logic.address, {from:minter_address});
            await this.nft_t_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.nft_t_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.nft_o_logic.setNFT_TransactionPool(this.nft_t_logic.address, {from:minter_address});
            await this.nft_o_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});

            await this.nft_c_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.nft_c_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.nft_c_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            await this.nft_c_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            await this.nft_c_logic.setERC777(this.token_logic.address, {from:minter_address});
            await this.nft_c_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});

            await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.nft_o_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.nft_o_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            await this.nft_o_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            await this.nft_o_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});

            await this.dm_logic.setERC777(this.token_logic.address, {from:minter_address});
            await this.dm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.dm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.dm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.rm_logic.setERC777(this.token_logic.address, {from:minter_address});
            await this.rm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.rm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.rm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.rm_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            await this.sm_logic.setERC777(this.token_logic.address, {from:minter_address});
            await this.sm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.sm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.sm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.pc_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.pc_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.pc_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.pc_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            await this.pc_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            // await this.gt_logic.setERC777(this.token_logic.address, {from:minter_address});
            // await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            // await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            // await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});


            await this.pc_logic.createProject(other_user, "Test project", "Production", "Script", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});

            await this.token_logic.setAddressRegistered(other_user, true, {from: minter_address});
            await this.token_logic.setAddressRegistered(digital_investor, true, {from: minter_address});

            let updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
            updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});

        });
        it('checking the addresses are different', async () => {
            assert.isFalse(minter_address == admin_address);
            assert.isFalse(minter_address == deployer_address);
            assert.isFalse(minter_address == other_user);
            assert.isFalse(admin_address == deployer_address);
            assert.isFalse(admin_address == other_user);
            assert.isFalse(deployer_address == other_user);
        });

        it('checking deployment was ok', async () => {
            assert.equal(await this.pc_logic.name({from: other_user}), pc_name, "pc name is not correct");
            assert.equal(await this.pc_logic.symbol({from: other_user}), pc_symbol, "pc symbol is not correct");
            assert.equal(await this.pc_logic.getCurrentVersion({from: other_user}), "1", "current pc version should be 1");
            assert.equal(await this.nft_c_logic.name({from: other_user}), nft_c_name, "nft name is not correct");
            assert.equal(await this.nft_c_logic.symbol({from: other_user}), nft_c_symbol, "nft symbol is not correct");
            assert.equal(await this.nft_c_logic.getCurrentVersion({from: other_user}), "1", "current nft version should be 1");
            assert.equal(await this.nft_o_logic.name({from: other_user}), nft_o_name, "nft ownership name is not correct");
            assert.equal(await this.nft_o_logic.symbol({from: other_user}), nft_o_symbol, "nft ownership symbol is not correct");
            assert.equal(await this.nft_o_logic.getCurrentVersion({from: other_user}), "1", "current nft ownership version should be 1");
            assert.equal(await this.nft_t_logic.name({from: other_user}), nft_t_name, "nft transaction pool name is not correct");
            assert.equal(await this.nft_t_logic.symbol({from: other_user}), nft_t_symbol, "nft transaction pool symbol is not correct");
            assert.equal(await this.nft_t_logic.getCurrentVersion({from: other_user}), "1", "current nft transaction pool version should be 1");
            assert.equal(await this.dm_logic.name({from: other_user}), dm_name, "DM name is not correct");
            assert.equal(await this.dm_logic.symbol({from: other_user}), dm_symbol, "DM symbol is not correct");
            assert.equal(await this.dm_logic.getCurrentVersion({from: other_user}), "1", "current nft transaction pool version should be 1");
            assert.equal(await this.rm_logic.name({from: other_user}), rm_name, "RM name is not correct");
            assert.equal(await this.rm_logic.symbol({from: other_user}), rm_symbol, "RM symbol is not correct");
            assert.equal(await this.rm_logic.getCurrentVersion({from: other_user}), "1", "current nft transaction pool version should be 1");
            assert.equal(await this.sm_logic.name({from: other_user}), sm_name, "SM name is not correct");
            assert.equal(await this.sm_logic.symbol({from: other_user}), sm_symbol, "SM symbol is not correct");
            assert.equal(await this.sm_logic.getCurrentVersion({from: other_user}), "1", "current nft transaction pool version should be 1");
            assert.equal(await this.token_logic.name({from: other_user}), t_name, "Token name is not correct");
            assert.equal(await this.token_logic.symbol({from: other_user}), t_symbol, "Token symbol is not correct");
            assert.equal(await this.token_logic.getCurrentVersion({from: other_user}), "1", "current nft transaction pool version should be 1");
            assert.equal(await this.gt_logic.name({from: other_user}), gt_name, "GT name is not correct");
            assert.equal(await this.gt_logic.symbol({from: other_user}), gt_symbol, "GT symbol is not correct");
            assert.equal(await this.gt_logic.getCurrentVersion({from: other_user}), "1", "current nft transaction pool version should be 1");
        });
        it('GovernanceToken reverting on incomplete setup', async () => {
            await expectRevert(this.gt_logic.depositTokens(
                    other_user,
                    "100",
                    "0",
                    {from: other_user})
                , "Setup is not ok");
        });

        it('GovernanceToken reverting on unauthorised setting up NFT Catalog', async () => {
            await expectRevert.unspecified(
                this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:deployer_address}));
        });
        it('GovernanceToken setting up NFT Catalog', async () => {
            let txResult = await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTCatalogSet', {
                nft_catalog: this.nft_c_logic.address,
            });
        });

        it('GovernanceToken reverting on unauthorised setting up NFT Ownership', async () => {
            await expectRevert.unspecified(
                this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:deployer_address}));
        });
        it('GovernanceToken setting up NFT Ownership', async () => {
            let txResult = await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTOwnershipSet', {
                nft_ownership: this.nft_o_logic.address,
            });
        });
        it('GovernanceToken reverting on unauthorised setting up ProjectCatalog', async () => {
            await expectRevert.unspecified(
                this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:deployer_address}));
        });
        it('GovernanceToken setting up ProjectCatalog', async () => {
            let txResult = await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ProjectCatalogSet', {
                project_catalog: this.pc_logic.address,
            });
        });
        it('GovernanceToken reverting on unauthorised setting up ERC777', async () => {
            await expectRevert.unspecified(
                this.gt_logic.setERC777(this.token_logic.address, {from:deployer_address}));
        });
        it('GovernanceToken setting up ERC777', async () => {
            let txResult = await this.gt_logic.setERC777(this.token_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ERC777Set', {
                token: this.token_logic.address,
            });
        });

        it('GovernanceToken check that setup is complete', async () => {
            const txResult = await this.gt_logic.depositTokens(
                other_user,
                "100",
                "0",
                {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'TokensDeposited', {
                by: other_user,
                project_id: "0",
                volume: "100"
            });
        });
    });

});
