const { expectEvent, expectRevert, singletons, constants, BN, bignumber, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect, assert} = require('chai');
const {concatSig} = require("eth-sig-util");
const {shouldBehaveLikeERC20Approve} = require("./OpenZeppelinERCBehavior/ERC20.behavior");
const { should } = require('chai').should();
const {getRevertReason} = require('eth-revert-reason');

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

contract('Finance Management - BRD', ([registryFunder, deployer_address, other_user, admin_address, minter_address, digital_investor]) => {

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
    const ZERO_SHARES = "0";
    const INITIAL_TOKEN_BALANCE = "200";

    context('deployment and setup checks', function () {
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
                minter_address,
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

            // await this.dm_logic.setERC777(this.token_logic.address, {from:minter_address});
            // await this.dm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            // await this.dm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            // await this.dm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            // await this.rm_logic.setERC777(this.token_logic.address, {from:minter_address});
            // await this.rm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            // await this.rm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            // await this.rm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            // await this.rm_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            // await this.sm_logic.setERC777(this.token_logic.address, {from:minter_address});
            // await this.sm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            // await this.sm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            // await this.sm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.pc_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.pc_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.pc_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.pc_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            await this.pc_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            await this.gt_logic.setERC777(this.token_logic.address, {from:minter_address});
            await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.pc_logic.createProject(other_user, "Test project", "Production", "Script", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});

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
            assert.equal(await this.gt_logic.name({from: other_user}), gt_name, "Token name is not correct");
            assert.equal(await this.gt_logic.symbol({from: other_user}), gt_symbol, "Token symbol is not correct");
            assert.equal(await this.gt_logic.getCurrentVersion({from: other_user}), "1", "current nft transaction pool version should be 1");
        });

        it('DebtManager reverting on incomplete setup', async () => {
            await expectRevert(this.dm_logic.registerDebt(
                    other_user,
                    "1",
                    "900",
                    "10",
                    SHARES_TOTAL.toString(),
                    {from: minter_address})
                , "Setup is not ok");
        });
        it('DebtManager reverting on unauthorised setting up NFT Catalog', async () => {
            await expectRevert.unspecified(
                this.dm_logic.setNFTCatalog(this.nft_c_logic.address, {from:deployer_address}));
        });
        it('DebtManager setting up NFT Catalog', async () => {
            let txResult = await this.dm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTCatalogSet', {
                nft_catalog: this.nft_c_logic.address,
            });
        });
        it('DebtManager reverting on unauthorised setting up NFT Ownership', async () => {
            await expectRevert.unspecified(
                this.dm_logic.setNFTOwnership(this.nft_o_logic.address, {from:deployer_address}));
        });
        it('DebtManager setting up NFT Ownership', async () => {
            let txResult = await this.dm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTOwnershipSet', {
                nft_ownership: this.nft_o_logic.address,
            });
        });
        it('DebtManager reverting on unauthorised setting up ProjectCatalog', async () => {
            await expectRevert.unspecified(
                this.dm_logic.setProjectCatalog(this.pc_logic.address, {from:deployer_address}));
        });
        it('DebtManager setting up ProjectCatalog', async () => {
            let txResult = await this.dm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ProjectCatalogSet', {
                project_catalog: this.pc_logic.address,
            });
        });
        it('DebtManager reverting on unauthorised setting up ERC777', async () => {
            await expectRevert.unspecified(
                this.dm_logic.setERC777(this.token_logic.address, {from:deployer_address}));
        });
        it('DebtManager setting up ERC777', async () => {
            let txResult = await this.dm_logic.setERC777(this.token_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ERC777Set', {
                token: this.token_logic.address,
            });
        });
        it('DebtManager checks that setup is complete', async () => {
            await this.dm_logic.registerDebt(
                other_user,
                "1",
                "900",
                "10",
                SHARES_TOTAL.toString(),
                {from: minter_address});
        });

        it('StakesManager reverting on incomplete setup', async () => {
            await expectRevert(this.sm_logic.stake(
                    other_user,
                    "550",
                    "1",
                    SHARES_TOTAL.toString(),
                    {from: other_user})
                , "Setup is not ok");
        });
        it('StakesManager reverting on unauthorised setting up NFT Catalog', async () => {
            await expectRevert.unspecified(
                this.sm_logic.setNFTCatalog(this.nft_c_logic.address, {from:deployer_address}));
        });
        it('StakesManager setting up NFT Catalog', async () => {
            let txResult = await this.sm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTCatalogSet', {
                nft_catalog: this.nft_c_logic.address,
            });
        });
        it('StakesManager reverting on unauthorised setting up NFT Ownership', async () => {
            await expectRevert.unspecified(
                this.sm_logic.setNFTOwnership(this.nft_o_logic.address, {from:deployer_address}));
        });
        it('StakesManager setting up NFT Ownership', async () => {
            let txResult = await this.sm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTOwnershipSet', {
                nft_ownership: this.nft_o_logic.address,
            });
        });
        it('StakesManager reverting on unauthorised setting up ProjectCatalog', async () => {
            await expectRevert.unspecified(
                this.sm_logic.setProjectCatalog(this.pc_logic.address, {from:deployer_address}));
        });
        it('StakesManager setting up ProjectCatalog', async () => {
            let txResult = await this.sm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ProjectCatalogSet', {
                project_catalog: this.pc_logic.address,
            });
        });
        it('StakesManager reverting on unauthorised setting up ERC777', async () => {
            await expectRevert.unspecified(
                this.sm_logic.setERC777(this.token_logic.address, {from:deployer_address}));
        });
        it('StakesManager setting up ERC777', async () => {
            let txResult = await this.sm_logic.setERC777(this.token_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ERC777Set', {
                token: this.token_logic.address,
            });
        });
        it('StakesManager checks that setup is complete', async () => {
            await this.sm_logic.stake(
                other_user,
                "500",
                "1",
                SHARES_TOTAL.toString(),
                {from: other_user});
        });

        it('RevenuesManager reverting on incomplete setup', async () => {
            await expectRevert(this.rm_logic.registerRevenue(
                    "1",
                    "2000",
                    {from: minter_address})
                , "Setup is not ok");
        });
        it('RevenuesManager reverting on unauthorised setting up NFT Catalog', async () => {
            await expectRevert.unspecified(
                this.rm_logic.setNFTCatalog(this.nft_c_logic.address, {from:deployer_address}));
        });
        it('RevenuesManager setting up NFT Catalog', async () => {
            let txResult = await this.rm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTCatalogSet', {
                nft_catalog: this.nft_c_logic.address,
            });
        });
        it('RevenuesManager reverting on unauthorised setting up NFT Ownership', async () => {
            await expectRevert.unspecified(
                this.rm_logic.setNFTOwnership(this.nft_o_logic.address, {from:deployer_address}));
        });
        it('RevenuesManager setting up NFT Ownership', async () => {
            let txResult = await this.rm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTOwnershipSet', {
                nft_ownership: this.nft_o_logic.address,
            });
        });
        it('RevenuesManager reverting on unauthorised setting up ProjectCatalog', async () => {
            await expectRevert.unspecified(
                this.rm_logic.setProjectCatalog(this.pc_logic.address, {from:deployer_address}));
        });
        it('RevenuesManager setting up ProjectCatalog', async () => {
            let txResult = await this.rm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ProjectCatalogSet', {
                project_catalog: this.pc_logic.address,
            });
        });
        it('RevenuesManager reverting on unauthorised setting up ERC777', async () => {
            await expectRevert.unspecified(
                this.rm_logic.setERC777(this.token_logic.address, {from:deployer_address}));
        });
        it('RevenuesManager setting up ERC777', async () => {
            let txResult = await this.rm_logic.setERC777(this.token_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ERC777Set', {
                token: this.token_logic.address,
            });
        });
        it('RevenuesManager reverting on unauthorised setting up StakesManager', async () => {
            await expectRevert.unspecified(
                this.rm_logic.setStakesManager(this.sm_logic.address, {from:deployer_address}));
        });
        it('RevenuesManager setting up StakesManager', async () => {
            let txResult = await this.rm_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'StakesManagerSet', {
                stakes_manager: this.sm_logic.address,
            });
        });
        it('RevenuesManager checks that setup is complete', async () => {
            await this.rm_logic.registerRevenue(
                "1",
                "2000",
                {from: minter_address});
        });

    });
    context('creating Debts, Revenues and Stakes', function () {
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
                minter_address,
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

            await this.gt_logic.setERC777(this.token_logic.address, {from:minter_address});
            await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.pc_logic.createProject(other_user, "Test project", "Production", "Script", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});

            await this.pc_logic.createProject(other_user, "Test project", "Completed", "BoxOffice", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "2", "2000", "5000", {from: other_user});

            let updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
            await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});
            await this.token_logic.fromEtherToTokens(deployer_address, {from: deployer_address, value: updated_amount});

        });

        it('reverting on unauthorised attempt to register a Debt', async () => {
            await expectRevert.unspecified(this.dm_logic.registerDebt(
                other_user,
                "1",
                "100",
                "10",
                SHARES_TOTAL.toString(), {from: deployer_address})
            );
        });
        it('reverting on wrong Project to register a Debt', async () => {
            await expectRevert(this.dm_logic.registerDebt(
                other_user,
                "42",
                "100",
                "10",
                SHARES_TOTAL.toString(), {from: minter_address})
            , "no NFT");
        });
        it('reverting checking non-existent Debt info for existing project', async () => {
            await expectRevert(
                this.dm_logic.getProjectDebtOutstanding ("1", {from: other_user})
                , "No such debt");
            await expectRevert(
                this.dm_logic.getProjectDebtIds ("1", {from: other_user})
                , "No such debt");
            await expectRevert(
                this.dm_logic.getProjectDebtOutstanding ("2", {from: other_user})
                , "No such debt");
            await expectRevert(
                this.dm_logic.getProjectDebtIds ("2", {from: other_user})
                , "No such debt");
        });
        it('reverting on checking Debt info on non-existent project', async () => {
            await expectRevert(
                this.dm_logic.getIndividualDebtOutstanding ("42", {from: other_user})
                , "no NFT");

            await expectRevert(
                this.dm_logic.getIndividualDebtRate ("42", {from: other_user})
                , "no NFT");
        });
        it('successfully registering Debt_1 for 1st project', async () => {
            let txResult = await this.dm_logic.registerDebt(
                other_user,
                "1",
                "100",
                "10",
                SHARES_TOTAL.toString(), {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtRegistered', {
                debtor: other_user,
                project_id: "1",
                debt_id : "3",
                principal: "100",
                apy_rate: "10"
            });
        });
        it('successfully registering Debt_2 for 1st project', async () => {
            let txResult = await this.dm_logic.registerDebt(
                digital_investor,
                "1",
                "200",
                "12",
                SHARES_TOTAL.toString(), {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtRegistered', {
                debtor: digital_investor,
                project_id: "1",
                debt_id : "4",
                principal: "200",
                apy_rate: "12"
            });
        });
        it('successfully registering Debt_3 for 2nd project', async () => {
            let txResult = await this.dm_logic.registerDebt(
                other_user,
                "2",
                "300",
                "5",
                SHARES_TOTAL.toString(), {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtRegistered', {
                debtor: other_user,
                project_id: "2",
                debt_id : "5",
                principal: "300",
                apy_rate: "5"
            });
        });
        it('checking Debt info Debt_1', async () => {
            const debt =
                await this.dm_logic.getIndividualDebtOutstanding ("3", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "100");
            assert.equal(interest.toString(), "0");

            const apy_rate  = await this.dm_logic.getIndividualDebtRate ("3", {from: other_user});
            assert.equal(apy_rate, "10");
        });
        it('checking Debt info Debt_2', async () => {
            const debt =
                await this.dm_logic.getIndividualDebtOutstanding ("4", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "200");
            assert.equal(interest.toString(), "0");

            const apy_rate  = await this.dm_logic.getIndividualDebtRate ("4", {from: other_user});
            assert.equal(apy_rate, "12");
        });
        it('checking Debt info Debt_3', async () => {
            const debt =
                await this.dm_logic.getIndividualDebtOutstanding ("5", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "300");
            assert.equal(interest.toString(), "0");

            const apy_rate  = await this.dm_logic.getIndividualDebtRate ("5", {from: other_user});
            assert.equal(apy_rate, "5");
        });
        it('reverting checking Debt info for a wrong project', async () => {
            await expectRevert(
                this.dm_logic.getProjectDebtOutstanding ("42", {from: other_user})
                , "no NFT");

            await expectRevert(
                this.dm_logic.getProjectDebtIds ("42", {from: other_user})
                , "no NFT");
        });
        it('checking Debt info for a Project_1', async () => {
            const debt =
                await this.dm_logic.getProjectDebtOutstanding ("1", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "300");
            assert.equal(interest.toString(), "0");

            const ids  = await this.dm_logic.getProjectDebtIds ("1", {from: other_user});
            assert.equal(ids.length, 2);
            assert.equal(ids[0].toString(), "3");
            assert.equal(ids[1].toString(), "4");
        });
        it('checking Debt info for a Project_2', async () => {
            const debt =
                await this.dm_logic.getProjectDebtOutstanding ("2", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];

            assert.equal(principal.toString(), "300");
            assert.equal(interest.toString(), "0");

            const ids  = await this.dm_logic.getProjectDebtIds ("2", {from: other_user});
            assert.equal(ids.length, 1);
            assert.equal(ids[0].toString(), "5");
        });


        it('reverting on wrong Project to stake', async () => {
            await expectRevert(this.sm_logic.stake(
                    other_user,
                    "500",
                    "42",
                    SHARES_TOTAL.toString(),
                    {from: other_user})
                , "no NFT");
        });
        it('reverting on unauthorised attempt to stake', async () => {
            await expectRevert(this.sm_logic.stake(
                    other_user,
                    "500",
                    "1",
                    SHARES_TOTAL.toString(),
                    {from: digital_investor})
                , "msg.sender is not approved");
        });
        it('reverting on not enough Tokens to stake', async () => {
            // revert (ExternalFuncs.toString(m_token.balanceOf(addr_from)));

            let balance = await this.token_logic.balanceOf(other_user);
            let increment = new BN ("1000");
            balance = balance.add(increment);

            await expectRevert(this.sm_logic.stake(
                    other_user,
                    balance,
                    "1",
                    SHARES_TOTAL.toString(),
                    {from: other_user})
                , "Not enough tokens in the wallet");
        });
        it('reverting on attempt to stake more than ProjectBudget', async () => {
            await expectRevert(this.sm_logic.stake(
                    other_user,
                    "3000",
                    "1",
                    SHARES_TOTAL.toString(),
                    {from: other_user})
                , "If made your stake would exceed total Project budget");
        });
        it('successfully registering a Revenue to test 0 Stakes case', async () => {
            let txResult = await this.rm_logic.registerRevenue(
                "1",
                "1000",
                {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenueRegistered', {
                by: minter_address,
                project_id: "1",
                amount: "1000",
            });
        });
        it('checking revenues to distribute', async () => {
            let total = await this.rm_logic.getProjectRevenuesToDistribute("1", {from: other_user});
            assert.equal(total.toString(), "1000");
        });

        let owner_token_balance;
        let buyer_token_balance;
        let company_token_balance;
        let stake_size = 300;
        let stake_size_total = 1000;
        it('recording balances before staking', async () => {
            owner_token_balance = await this.token_logic.balanceOf(other_user);
            company_token_balance = await this.token_logic.balanceOf(minter_address); //company address
        });
        it('successfully making Stake 1 for Project 1', async () => {
            stake_size_total -= stake_size;
            let txResult = await this.sm_logic.stake(
                other_user,
                stake_size.toString(),
                "1",
                SHARES_TOTAL.toString(),
                {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Staked', {
                from: other_user,
                project_id: "1",
                stake_id : "6",
                amount: "300",
            });
        });
        it('checking balances after staking', async () => {
            let token_balance = await this.token_logic.balanceOf(other_user);
            let _stake_size = new BN (stake_size.toString());
            expect(token_balance).to.be.bignumber.equal(owner_token_balance.sub(_stake_size));

            token_balance = await this.token_logic.balanceOf(minter_address); //company address
            expect(token_balance).to.be.bignumber.equal(company_token_balance.add(_stake_size));
        });
        it('reverting on checking non-existing ProjectBudget', async () => {
            await this.pc_logic.createProject(other_user, "Test project", "Completed", "BoxOffice", SHARES_TOTAL.toString(), {from: other_user});
            await expectRevert(this.pc_logic.getProjectBudgetTotal("7", {from: other_user})
                , "Project budget either doesn't exist or is closed");
            await expectRevert(this.pc_logic.getProjectStakesTotal("7", {from: other_user})
                , "Project budget either doesn't exist or is closed");
            await expectRevert(this.pc_logic.getProjectStakesAvailable("7", {from: other_user})
                , "Project budget either doesn't exist or is closed");
        });
        it('checking ProjectBudget is correctly updated after making Stake 1', async () => {
            const project_budget = await this.pc_logic.getProjectBudgetTotal("1", {from: other_user});
            expect(project_budget).to.be.bignumber.equal("1000");

            const _stakes_total = await this.pc_logic.getProjectStakesTotal("1", {from: other_user});
            expect(_stakes_total).to.be.bignumber.equal(stake_size.toString());

            //available = total - spent
            // const stakes_available = await this.pc_logic.getProjectStakesAvailable("1", {from: other_user});
            // expect(stakes_available).to.be.bignumber.equal(project_budget.sub(_stakes_total));
        });
        it('reverting on unauthorised attempt to register a Revenue', async () => {
            await expectRevert.unspecified(this.rm_logic.registerRevenue(
                "1",
                "2000",
                {from: other_user}));
        });
        it('successfully registering a Revenue to test 1 Stake case', async () => {
            let txResult = await this.rm_logic.registerRevenue(
                "1",
                "1000",
                {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenueRegistered', {
                by: minter_address,
                project_id: "1",
                amount: "1000",
            });
        });
        it('checking revenues to distribute', async () => {
            let total = await this.rm_logic.getProjectRevenuesToDistribute("1", {from: other_user});
            assert.equal(total.toString(), "2000");
        });
        it('successfully making Stake 2 for Project 1', async () => {
            stake_size_total -= stake_size;
            let txResult = await this.sm_logic.stake(
                digital_investor,
                stake_size.toString(),
                "1",
                SHARES_TOTAL.toString(),
                {from: digital_investor});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Staked', {
                from: digital_investor,
                project_id: "1",
                stake_id : "8",
                amount: "300",
            });
        });
        it('checking ProjectBudget is correctly updated after making Stake 2', async () => {
            const project_budget = await this.pc_logic.getProjectBudgetTotal("1", {from: other_user});
            expect(project_budget).to.be.bignumber.equal("1000");

            const _stakes_total = await this.pc_logic.getProjectStakesTotal("1", {from: other_user});
            let _stake_size = new BN ((stake_size * 2).toString());
            expect(_stakes_total).to.be.bignumber.equal(_stake_size);

            //available = total - spent
            // const stakes_available = await this.pc_logic.getProjectStakesAvailable("1", {from: other_user});
            // expect(stakes_available).to.be.bignumber.equal(project_budget.sub(_stakes_total));
        });
        it('successfully making Stake 3 for Project 1', async () => {
            let txResult = await this.sm_logic.stake(
                deployer_address,
                stake_size_total.toString(),
                "1",
                SHARES_TOTAL.toString(),
                {from: deployer_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Staked', {
                from: deployer_address,
                project_id: "1",
                stake_id : "9",
                amount: "400",
            });
        });
        it('checking ProjectBudget is correctly updated after making Stake 3', async () => {
            const project_budget = await this.pc_logic.getProjectBudgetTotal("1", {from: other_user});
            expect(project_budget).to.be.bignumber.equal("1000");

            const _stakes_total = await this.pc_logic.getProjectStakesTotal("1", {from: other_user});
            expect(_stakes_total).to.be.bignumber.equal(project_budget);

            //available = total - spent
            // const stakes_available = await this.pc_logic.getProjectStakesAvailable("1", {from: other_user});
            // expect(stakes_available).to.be.bignumber.equal(project_budget.sub(_stakes_total));
        });
        it('successfully registering a Revenue to test 3 Stakes case', async () => {
            let txResult = await this.rm_logic.registerRevenue(
                "1",
                "1000",
                {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenueRegistered', {
                by: minter_address,
                project_id: "1",
                amount: "1000",
            });
        });
        it('checking revenues to distribute', async () => {
            let total = await this.rm_logic.getProjectRevenuesToDistribute("1", {from: other_user});
            assert.equal(total.toString(), "3000");
        });
        it('successfully making Stake 1 for Project 2', async () => {
            let txResult = await this.sm_logic.stake(
                other_user,
                stake_size.toString(),
                "2",
                SHARES_TOTAL.toString(),
                {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Staked', {
                from: other_user,
                project_id: "2",
                stake_id : "10",
                amount: "300",
            });
        });
        it('successfully making Stake 2 for Project 2', async () => {
            let txResult = await this.sm_logic.stake(
                digital_investor,
                stake_size_total.toString(),
                "2",
                SHARES_TOTAL.toString(),
                {from: digital_investor});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Staked', {
                from: digital_investor,
                project_id: "2",
                stake_id : "11",
                amount: "400",
            });
        });
        it('successfully registering a Revenue to test 2 Stakes case', async () => {
            let txResult = await this.rm_logic.registerRevenue(
                "2",
                "1000",
                {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenueRegistered', {
                by: minter_address,
                project_id: "2",
                amount: "1000",
            });
        });
        it('checking revenues to distribute', async () => {
            let total = await this.rm_logic.getProjectRevenuesToDistribute("2", {from: other_user});
            assert.equal(total.toString(), "1000");
        });


        it('reverting on checking Stake info for non-existent Stake', async () => {
            await expectRevert(this.sm_logic.getStakeVolume("42", {from: other_user})
            , "no such Stake");
        });
        it('checking Stake info for Stake 1', async () => {
            const stake_volume = await this.sm_logic.getStakeVolume("6", {from: other_user});
            assert.equal(stake_volume.toString(), "300");
        });
        it('checking Stake info for Stake 2', async () => {
            const stake_volume = await this.sm_logic.getStakeVolume("8", {from: other_user});
            assert.equal(stake_volume.toString(), "300");
        });
        it('checking Stake info for Stake 3', async () => {
            const stake_volume = await this.sm_logic.getStakeVolume("9", {from: other_user});
            assert.equal(stake_volume.toString(), "400");
        });
        it('checking Stake info for Stake 4', async () => {
            const stake_volume = await this.sm_logic.getStakeVolume("10", {from: other_user});
            assert.equal(stake_volume.toString(), "300");
        });
        it('checking Stake info for Stake 5', async () => {
            const stake_volume = await this.sm_logic.getStakeVolume("11", {from: other_user});
            assert.equal(stake_volume.toString(), "400");
        });
        it('reverting on checking Stakes for non-existent Project', async () => {
            await expectRevert(
                this.sm_logic.getProjectStakeIds("42", {from: other_user})
                , "no NFT");
        });
        it('checking Stakes for Project 1', async () => {
            const ids = await this.sm_logic.getProjectStakeIds("1", {from: other_user});
            assert.equal(ids.length, 3);
            assert.equal(ids[0].toString(), "6");
            assert.equal(ids[1].toString(), "8");
            assert.equal(ids[2].toString(), "9");
        });
        it('checking Stakes for Project 2', async () => {
            const ids = await this.sm_logic.getProjectStakeIds("2", {from: other_user});
            assert.equal(ids.length, 2);
            assert.equal(ids[0].toString(), "10");
            assert.equal(ids[1].toString(), "11");
        });
    });
    context('paying out the Debts and distributing Revenues', function () {
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
                minter_address,
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

            await this.gt_logic.setERC777(this.token_logic.address, {from:minter_address});
            await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            let updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
            await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});
            await this.token_logic.fromEtherToTokens(deployer_address, {from: deployer_address, value: updated_amount});

        });

        let revenue_TS_1;
        let revenue_TS_2;
        let other_user_balance;
        let digital_investor_balance
        let deployer_address_balance;
        let company_account_balance;

        it('creating Projects instances', async () => {
            //1
            await this.pc_logic.createProject(other_user, "Test project 1", "Production", "Script", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});
            //2
            await this.pc_logic.createProject(other_user, "Test project 2", "Completed", "BoxOffice", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "2", "2000", "5000", {from: other_user});
            //3
            await this.pc_logic.createProject(other_user, "Empty project", "Completed", "BoxOffice", SHARES_TOTAL.toString(), {from: other_user});
        });
        it('creating Debt instances', async () => {
            //4
            await this.dm_logic.registerDebt(other_user, "1", "100000", "388", SHARES_TOTAL.toString(), {from: minter_address});
            //5
            await this.dm_logic.registerDebt(digital_investor, "1", "200000", "265", SHARES_TOTAL.toString(), {from: minter_address});
            //6
            await this.dm_logic.registerDebt(other_user, "2", "300000", "136", SHARES_TOTAL.toString(), {from: minter_address});

        });
        //Revenue requires a timestamp, therefore separated
        it('creating Stakes and Revenues instances 1', async () => {
            const stake_1 = 300;
            const stake_2 = 400;

            await this.rm_logic.registerRevenue("1", "1000", {from: minter_address});
            //7
            await this.sm_logic.stake(other_user, stake_1.toString(), "1", SHARES_TOTAL.toString(), {from: other_user});
            await this.rm_logic.registerRevenue("1", "1000", {from: minter_address});

            let block = await web3.eth.getBlock('latest');
            revenue_TS_1 = block.timestamp;
        });

        // Debt
        it('reverting on getting Debt Rate for non-existent Debt', async () => {
            await expectRevert (this.dm_logic.getIndividualDebtRate("42", {from: other_user})
            , "no NFT"
            );
        });
        it('sucessfully getting Debt Rate for Debt', async () => {
            const apy_rate = await this.dm_logic.getIndividualDebtRate("4", {from: other_user});
            assert.equal(apy_rate, "388");
        });
        it('reverting on setting Debt Rate for non-existent Debt', async () => {
            await expectRevert (this.dm_logic.setIndividualDebtRate("42", "2000", {from: minter_address})
                , "no NFT"
            );
        });
        it('reverting on unauthorised attempt of setting Debt Rate', async () => {
            await expectRevert.unspecified(this.dm_logic.setIndividualDebtRate("4", "2000", {from: other_user}));
        });
        it('checking Debt info for a Project_1', async () => {
            const debt =
                await this.dm_logic.getProjectDebtOutstanding ("1", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "300000");
            assert.equal(interest.toString(), "0");

            const ids  = await this.dm_logic.getProjectDebtIds ("1", {from: other_user});
            assert.equal(ids.length, 2);
            assert.equal(ids[0].toString(), "4");
            assert.equal(ids[1].toString(), "5");
        });
        it('successfully setting Debt Rate for Debt', async () => {
            let txResult = await this.dm_logic.setIndividualDebtRate("4", "507", {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtRateReset', {
                project_id: "1",
                debt_id : "4",
                apy_rate: "507",
            });

            const apy_rate = await this.dm_logic.getIndividualDebtRate("4", {from: other_user});
            assert.equal(apy_rate, "507");
        });
        it('checking Debt info for a Project_1', async () => {
            const debt =
                await this.dm_logic.getProjectDebtOutstanding ("1", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "300000");
            assert.equal(interest.toString(), "0");

            const ids  = await this.dm_logic.getProjectDebtIds ("1", {from: other_user});
            assert.equal(ids.length, 2);
            assert.equal(ids[0].toString(), "4");
            assert.equal(ids[1].toString(), "5");
        });

        // todo: THIS MUST FAIL IF TESTED RIGHT BEFORE DEPLOYMENT
        // faking Debt to make sure it has some interest to payout
        it('reverting on unauthorised attempt of changing Timestamp start', async () => {

            let block = await web3.eth.getBlock('latest');
            let finish = block.timestamp;
            let period = 30 * 24 * 60 * 60; // 30 days
            let start = finish - period;

            await expectRevert.unspecified(this.dm_logic.addIndividualDebtInterestPeriod(
                "1",
                "4",
                "620",
                start.toString(),
                finish.toString(),
                {from: other_user}));
        });
        it('successfully setting Debt Interest ADDITIONAL period 1', async () => {
            let block = await web3.eth.getBlock('latest');
            let finish = block.timestamp;
            let period = 30 * 24 * 60 * 60; // 30 days
            let start = finish - period;

            await this.dm_logic.addIndividualDebtInterestPeriod(
                "1",
                "4",
                "620",
                start.toString(),
                finish.toString(),
                {from: minter_address});

            await this.dm_logic.getIndividualDebtRate("4", {from: other_user});
            const apy_rate = await this.dm_logic.getIndividualDebtRate("4", {from: other_user});
            assert.equal(apy_rate, "620");
        });
        it('checking Debt info Debt_1', async () => {
            const debt =
                await this.dm_logic.getIndividualDebtOutstanding ("4", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "100000");
            assert.equal(interest.toString(), "1876");

            const apy_rate  = await this.dm_logic.getIndividualDebtRate ("4", {from: other_user});
            assert.equal(apy_rate, "620");
        });
        it('checking Debt info for a Project_1', async () => {
            const debt =
                await this.dm_logic.getProjectDebtOutstanding ("1", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "300000");
            assert.equal(interest.toString(), "1876");

            const ids  = await this.dm_logic.getProjectDebtIds ("1", {from: other_user});
            assert.equal(ids.length, 2);
            assert.equal(ids[0].toString(), "4");
            assert.equal(ids[1].toString(), "5");
        });
        it('successfully setting Debt Interest ADDITIONAL period 2', async () => {
            let block = await web3.eth.getBlock('latest');
            let finish = block.timestamp;
            let period = 180 * 24 * 60 * 60; // 180 days
            let start = finish - period;

            await this.dm_logic.addIndividualDebtInterestPeriod(
                "1",
                "4",
                "315",
                start.toString(),
                finish.toString(),
                {from: minter_address});

            await this.dm_logic.getIndividualDebtRate("4", {from: other_user});
            const apy_rate = await this.dm_logic.getIndividualDebtRate("4", {from: other_user});
            assert.equal(apy_rate, "315");
        });
        it('checking Debt info Debt_1', async () => {
            const debt =
                await this.dm_logic.getIndividualDebtOutstanding ("4", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "100000");
            assert.equal(interest.toString(), "7708");

            const apy_rate  = await this.dm_logic.getIndividualDebtRate ("4", {from: other_user});
            assert.equal(apy_rate, "315");
        });
        it('checking Debt info for a Project_1', async () => {
            const debt =
                await this.dm_logic.getProjectDebtOutstanding ("1", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "300000");
            assert.equal(interest.toString(), "7708");

            const ids  = await this.dm_logic.getProjectDebtIds ("1", {from: other_user});
            assert.equal(ids.length, 2);
            assert.equal(ids[0].toString(), "4");
            assert.equal(ids[1].toString(), "5");
        });

        it('reverting on unauthorised attempt of paying out an Individual Debt', async () => {
            await expectRevert.unspecified(this.dm_logic.payoutIndividualDebt("4", {from: other_user}));
        });
        it('checking Debt info Debt_3', async () => {
            const debt =
                await this.dm_logic.getIndividualDebtOutstanding ("6", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "300000");
            assert.equal(interest.toString(), "0");

            const apy_rate  = await this.dm_logic.getIndividualDebtRate ("6", {from: other_user});
            assert.equal(apy_rate, "136");
        });

        it('recording balances before pay out of Debt for Project 2', async () => {
            other_user_balance = await this.token_logic.balanceOf(other_user);
            company_account_balance = await this.token_logic.balanceOf(minter_address); //company address
        });
        it('successfully paying out an Individual Debt for Project 2', async () => {
            let txResult = await this.dm_logic.payoutIndividualDebt("6", {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtIsPaidOut', {
                project_id: "2",
                debt_id : "6",
                amount: "300000"
            });
        });
        it('check and record balances after token transaction', async () => {
            let debt = new BN ("300000");

            let token_balance = await this.token_logic.balanceOf(other_user);
            expect(token_balance).to.be.bignumber.equal(other_user_balance.add(debt));

            token_balance = await this.token_logic.balanceOf(minter_address); //company address
            expect(token_balance).to.be.bignumber.equal(company_account_balance.sub(debt));
        });
        it('reverting on checking Debt info Debt_3 after it was paid out', async () => {
            await expectRevert(this.dm_logic.getIndividualDebtOutstanding ("6", {from: minter_address})
            , "no NFT");
        });
        it('checking Debt info for a Project_2', async () => {
                await expectRevert(this.dm_logic.getProjectDebtOutstanding ("2", {from: minter_address})
            , "No such debt");
        });

        it('reverting on unauthorised attempt of paying out a Project Debt', async () => {
            await expectRevert.unspecified(this.dm_logic.payoutProjectDebt("1", {from: other_user}));
        });
        it('checking Debt info Project 1', async () => {
            const debt =
                await this.dm_logic.getProjectDebtOutstanding ("1", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "300000");
            assert.equal(interest.toString(), "7708");

            const ids  = await this.dm_logic.getProjectDebtIds ("1", {from: other_user});
            assert.equal(ids.length, 2);
            assert.equal(ids[0].toString(), "4");
            assert.equal(ids[1].toString(), "5");
        });
        it('successfully paying out a Project Debt for Project 1', async () => {
            let txResult = await this.dm_logic.payoutProjectDebt("1", {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtIsPaidOut', {
                project_id: "1",
                debt_id : "4",
                amount: "107708"
            });
            expectEvent.inLogs(logs, 'DebtIsPaidOut', {
                project_id: "1",
                debt_id : "5",
                amount: "200000"
            });
        });
        it('reverting on checking Debt info for Project 1 after it was paid out', async () => {
            await expectRevert(this.dm_logic.getProjectDebtOutstanding ("1", {from: other_user})
                , "No such debt");
        });

        it('preparing Debt for testing multi-ownership', async () => {
            //12
            await this.dm_logic.registerDebt(other_user, "1", "100000", "388", SHARES_TOTAL.toString(), {from: minter_address});
            const nft_id = new BN ("8"); //new debt_id
            let is_ether_payment = true;
            await this.nft_c_logic.approveTransaction(
                other_user,
                deployer_address,
                nft_id,
                (SHARES_TOTAL/2).toString(),
                "1000", //price
                is_ether_payment,
                {from: other_user});
            await this.nft_c_logic.implementTransaction("1", {from: deployer_address, value: "1000"});

            expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal((SHARES_TOTAL/2).toString());
            expect(await this.nft_o_logic.getSharesAvailable(deployer_address, nft_id, {from: deployer_address})).to.be.bignumber.equal((SHARES_TOTAL/2).toString());
        });
        it('successfully setting Debt Interest ADDITIONAL period 1', async () => {
            let block = await web3.eth.getBlock('latest');
            let finish = block.timestamp;
            let period = 30 * 24 * 60 * 60; // 30 days
            let start = finish - period;

            await this.dm_logic.addIndividualDebtInterestPeriod(
                "1",
                "8",
                "620",
                start.toString(),
                finish.toString(),
                {from: minter_address});
        });
        it('checking Debt info multi-ownership Debt', async () => {
            const debt =
                await this.dm_logic.getIndividualDebtOutstanding ("8", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "100000");
            assert.equal(interest.toString(), "1876");
        });
        it('checking Debt info for a Project_1', async () => {
            const debt =
                await this.dm_logic.getProjectDebtOutstanding ("1", {from: minter_address});
            const principal = debt[0];
            const interest = debt[1];
            assert.equal(principal.toString(), "100000");
            assert.equal(interest.toString(), "1876");

            const ids  = await this.dm_logic.getProjectDebtIds ("1", {from: other_user});
            assert.equal(ids.length, 1);
            assert.equal(ids[0].toString(), "8");
        });
        it('recording balances before pay out of multi-owned Debt for Project 1', async () => {
            other_user_balance = await this.token_logic.balanceOf(other_user);
            deployer_address_balance = await this.token_logic.balanceOf(deployer_address);
            company_account_balance = await this.token_logic.balanceOf(minter_address); //company address
        });
        it('successfully paying out a multi-owned Project Debt for Project 1', async () => {
            let txResult = await this.dm_logic.payoutProjectDebt("1", {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtIsPaidOut', {
                project_id: "1",
                debt_id : "8",
                amount: "101876"
            });
        });
        it('check and record balances after paying out multi-owned Debt for Project 1', async () => {
            let debt = new BN ("101876");
            let received = new BN ("50938");

            let token_balance = await this.token_logic.balanceOf(other_user);
            expect(token_balance).to.be.bignumber.equal(other_user_balance.add(received));

            token_balance = await this.token_logic.balanceOf(deployer_address);
            expect(token_balance).to.be.bignumber.equal(deployer_address_balance.add(received));

            token_balance = await this.token_logic.balanceOf(minter_address); //company address
            expect(token_balance).to.be.bignumber.equal(company_account_balance.sub(debt));
        });


        //Revenue requires a timestamp, therefore separated
        it('creating Stakes and Revenues instances 2', async () => {
            const stake_1 = 300;
            const stake_2 = 400;

            //9
            await this.sm_logic.stake(digital_investor, stake_1.toString(), "1", SHARES_TOTAL.toString(), {from: digital_investor});
            //10
            await this.sm_logic.stake(deployer_address, stake_2.toString(), "1", SHARES_TOTAL.toString(), {from: deployer_address});
            await this.rm_logic.registerRevenue("1", "1000", {from: minter_address});

            //11
            await this.sm_logic.stake(other_user, stake_1.toString(), "2", SHARES_TOTAL.toString(), {from: other_user});
            //12
            await this.sm_logic.stake(digital_investor, stake_2.toString(), "2", SHARES_TOTAL.toString(), {from: digital_investor});
            await this.rm_logic.registerRevenue("2", "1000", {from: minter_address});
            let block = await web3.eth.getBlock('latest');
            revenue_TS_2 = block.timestamp;
        });
        //Revenues
        it('reverting on unauthorised attempt of distributing Revenues', async () => {
            let block = await web3.eth.getBlock('latest');
            let now = block.timestamp;

            await expectRevert.unspecified(
                this.rm_logic.payoutRevenue("1", now.toString, {from: other_user}));
        });
        it('reverting on attempt to distribute Revenues for non-existent Project', async () => {
            let block = await web3.eth.getBlock('latest');
            let now = block.timestamp;

            await expectRevert(
                this.rm_logic.payoutRevenue("42", now.toString, {from: minter_address})
            , "no NFT"
            );
        });
        it('checking revenues to distribute', async () => {
            let total = await this.rm_logic.getProjectRevenuesToDistribute("1", {from: other_user});
            assert.equal(total.toString(), "3000");
            total = await this.rm_logic.getProjectRevenuesToDistribute("2", {from: other_user});
            assert.equal(total.toString(), "1000");
        });
        it('recording balances before distribution for Project 1', async () => {
            other_user_balance = await web3.eth.getBalance(other_user);
            digital_investor_balance = await web3.eth.getBalance(digital_investor);
            deployer_address_balance = await web3.eth.getBalance(deployer_address);
            company_account_balance = await web3.eth.getBalance(minter_address);
        });
        it('successfully distributing two Revenues for Project 1, beneficiaries - no Stakes and two Stakes', async () => {
            let block = await web3.eth.getBlock('latest');
            let total = await this.rm_logic.getProjectRevenuesToDistribute("1", {from: other_user});
            assert.equal(total.toString(), "3000");

            let txResult = await this.rm_logic.payoutRevenue("1", (block.timestamp+10).toString(), {from: minter_address, value: total});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenueDistributed', {
                project_id: "1",
                amount: "3000"
            });
        });
        it('checking and recording balances after distribution for Project 1', async () => {
            const _other_user_balance = new BN(other_user_balance.toString());
            const _digital_investor_balance = new BN(digital_investor_balance.toString());
            const _deployer_address_balance = new BN(deployer_address_balance.toString());
            const _company_account_balance = new BN(company_account_balance.toString());

            //1000 out of 3000 should be kept for company, as there were no stakes at the moment of registering the revenues
            const _paid_out = new BN("2000");
            const _other_user_amount = new BN("1300");
            const _digital_investor_amount = new BN("300");
            const _deployer_address_amount = new BN("400");


            let ether_balance = await web3.eth.getBalance(minter_address);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.lte(_company_account_balance.sub(_paid_out));

            ether_balance = await web3.eth.getBalance(other_user);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.equal(_other_user_balance.add(_other_user_amount));

            ether_balance = await web3.eth.getBalance(digital_investor);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.equal(_digital_investor_balance.add(_digital_investor_amount));

            ether_balance = await web3.eth.getBalance(deployer_address);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.equal(_deployer_address_balance.add(_deployer_address_amount));
        });
        it('successfully not distributing any Revenue for Project 2 - by timestamp limit', async () => {
            let total = await this.rm_logic.getProjectRevenuesToDistribute("2", {from: other_user});
            assert.equal(total.toString(), "1000");

            let txResult = await this.rm_logic.payoutRevenue("2", revenue_TS_1.toString(), {from: minter_address, value: total});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenueDistributed', {
                project_id: "2",
                amount: "0"
            });
        });
        it('recording balances before distribution for Project 2', async () => {
            other_user_balance = await web3.eth.getBalance(other_user);
            digital_investor_balance = await web3.eth.getBalance(digital_investor);
            company_account_balance = await web3.eth.getBalance(minter_address);
        });
        it('successfully distributing one Revenue for Project 2, beneficiaries - two Stakes', async () => {
            let total = await this.rm_logic.getProjectRevenuesToDistribute("2", {from: other_user});
            assert.equal(total.toString(), "1000");

            let block = await web3.eth.getBlock('latest');
            let now = block.timestamp+10;

            let txResult = await this.rm_logic.payoutRevenue("2", now.toString(), {from: minter_address, value: total});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenueDistributed', {
                project_id: "2",
                amount: "1000"
            });
        });
        it('checking and recording balances after distribution for Project 2', async () => {
            const _other_user_balance = new BN(other_user_balance.toString());
            const _digital_investor_balance = new BN(digital_investor_balance.toString());
            const _company_account_balance = new BN(company_account_balance.toString());

            //1000 out of 3000 should be kept for company, as there were no stakes at the moment of registering the revenues
            const _paid_out = new BN("1000");
            const _other_user_amount = new BN("428");
            const _digital_investor_amount = new BN("571"); //rounding


            let ether_balance = await web3.eth.getBalance(minter_address);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.lte(_company_account_balance.sub(_paid_out));

            ether_balance = await web3.eth.getBalance(other_user);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.equal(_other_user_balance.add(_other_user_amount));

            ether_balance = await web3.eth.getBalance(digital_investor);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.equal(_digital_investor_balance.add(_digital_investor_amount));
        });

        it('preparing Stake and Revenue for testing multi-ownership', async () => {
            const nft_id = new BN ("11"); //existing stake_id
            let is_ether_payment = true;
            await this.nft_c_logic.approveTransaction(
                other_user,
                deployer_address,
                nft_id,
                (SHARES_TOTAL/2).toString(),
                "1000", //price
                is_ether_payment,
                {from: other_user});
            await this.nft_c_logic.implementTransaction("2", {from: deployer_address, value: "1000"});

            expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal((SHARES_TOTAL/2).toString());
            expect(await this.nft_o_logic.getSharesAvailable(deployer_address, nft_id, {from: deployer_address})).to.be.bignumber.equal((SHARES_TOTAL/2).toString());

            await this.rm_logic.registerRevenue("2", "1000", {from: minter_address});
        });
        it('recording balances before distribution for multi-owned Stakes of Project 2', async () => {
            other_user_balance = await web3.eth.getBalance(other_user);
            digital_investor_balance = await web3.eth.getBalance(digital_investor);
            deployer_address_balance = await web3.eth.getBalance(deployer_address);
            company_account_balance = await web3.eth.getBalance(minter_address);
        });
        it('successfully distributing one Revenue for multi-owned Stakes of Project 2, beneficiaries - two Stakes', async () => {
            let total = await this.rm_logic.getProjectRevenuesToDistribute("2", {from: other_user});
            assert.equal(total.toString(), "1000");

            let block = await web3.eth.getBlock('latest');
            let now = block.timestamp+10;

            let txResult = await this.rm_logic.payoutRevenue("2", now.toString(), {from: minter_address, value: total});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenueDistributed', {
                project_id: "2",
                amount: "1000"
            });
        });
        it('checking and recording balances after distribution multi-owned Stakes of for Project 2', async () => {
            const _other_user_balance = new BN(other_user_balance.toString());
            const _digital_investor_balance = new BN(digital_investor_balance.toString());
            const _deployer_address_balance = new BN(deployer_address_balance.toString());
            const _company_account_balance = new BN(company_account_balance.toString());

            //1000 out of 3000 should be kept for company, as there were no stakes at the moment of registering the revenues
            const _paid_out = new BN("1000");
            const _other_user_amount = new BN("214");
            const _deployer_address_amount = new BN("214");
            const _digital_investor_amount = new BN("571"); //rounding


            let ether_balance = await web3.eth.getBalance(minter_address);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.lte(_company_account_balance.sub(_paid_out));

            ether_balance = await web3.eth.getBalance(other_user);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.equal(_other_user_balance.add(_other_user_amount));

            ether_balance = await web3.eth.getBalance(deployer_address);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.equal(_deployer_address_balance.add(_deployer_address_amount));

            ether_balance = await web3.eth.getBalance(digital_investor);
            ether_balance = new BN(ether_balance.toString());
            expect(ether_balance).to.be.bignumber.equal(_digital_investor_balance.add(_digital_investor_amount));
        });
    });
    context('closing Debts and Stakes', function () {
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
                minter_address,
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

            await this.gt_logic.setERC777(this.token_logic.address, {from:minter_address});
            await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            let updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
            await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});
            await this.token_logic.fromEtherToTokens(deployer_address, {from: deployer_address, value: updated_amount});

        });

        it('creating Projects and Debts instances for Debt testing', async () => {
            //1
            await this.pc_logic.createProject(other_user, "Test project 1", "Production", "Script", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});
            //2
            await this.dm_logic.registerDebt(other_user, "1", "100000", "136", SHARES_TOTAL.toString(), {from: minter_address});
        });
        it('splitting Debt ownership', async () => {
            //12
            const nft_id = new BN ("2"); //new debt_id
            let is_ether_payment = true;
            await this.nft_c_logic.approveTransaction(
                other_user,
                deployer_address,
                nft_id,
                (SHARES_TOTAL/2).toString(),
                "1000", //price
                is_ether_payment,
                {from: other_user});
            await this.nft_c_logic.implementTransaction("1", {from: deployer_address, value: "1000"});

            expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal((SHARES_TOTAL/2).toString());
            expect(await this.nft_o_logic.getSharesAvailable(deployer_address, nft_id, {from: deployer_address})).to.be.bignumber.equal((SHARES_TOTAL/2).toString());
        });
        it('reverting on attempt to delete a Project with some Debt, no Stakes no Revenues', async () => {
            await expectRevert(this.pc_logic.deleteProject(other_user, "1", {from: other_user})
                , "Project has debt");
        });
        it('successfully paying out an Individual Debt', async () => {
            let txResult = await this.dm_logic.payoutIndividualDebt("2", {from: minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtIsPaidOut', {
                project_id: "1",
                debt_id : "2",
                amount: "100000"
            });
        });
        it('checking Individual Debt doesn\'t exist', async () => {
            await expectRevert(this.dm_logic.individualDebtExists("2", {from: minter_address})
                , "no NFT");
        });
        it('checking Project Debt doesn\'t exist', async () => {
            let exists = await this.dm_logic.projectDebtExists("1", {from: minter_address});
            assert.isFalse(exists);
        });

        it('creating Revenues instances for Revenue testing', async () => {
            await this.rm_logic.registerRevenue("1", "1000", {from: minter_address});
        });
        it('reverting on attempt to delete a Project with Revenues, no Stake no Debt', async () => {
            await expectRevert(this.pc_logic.deleteProject(other_user, "1", {from: other_user})
                , "Project has revenues");
        });
        it('successfully distributing the Revenues', async () => {
            let block = await web3.eth.getBlock('latest');

            let total = await this.rm_logic.getProjectRevenuesToDistribute("1", {from: other_user});
            await this.rm_logic.payoutRevenue("1", (block.timestamp+10).toString(), {from: minter_address, value: total});

            total = await this.rm_logic.getProjectRevenuesToDistribute("1", {from: other_user});
            assert.equal(total.toString(), "0");
        });

        let other_user_balance;
        let digital_investor_balance
        let deployer_address_balance;
        let company_account_balance;
        it('creating Debts and Stakes instances for Stake testing', async () => {
            const stake_1 = 300;
            const stake_2 = 400;

            //3
            await this.sm_logic.stake(other_user, stake_1.toString(), "1", SHARES_TOTAL.toString(), {from: other_user});
            //4
            await this.sm_logic.stake(digital_investor, stake_1.toString(), "1", SHARES_TOTAL.toString(), {from: digital_investor});
            //5
            await this.sm_logic.stake(other_user, stake_2.toString(), "1", SHARES_TOTAL.toString(), {from: other_user});

            const nft_id = new BN ("5"); //existing stake_id
            let is_ether_payment = true;
            await this.nft_c_logic.approveTransaction(
                other_user,
                deployer_address,
                nft_id,
                (SHARES_TOTAL/2).toString(),
                "1000", //price
                is_ether_payment,
                {from: other_user});
            await this.nft_c_logic.implementTransaction("2", {from: deployer_address, value: "1000"});

            expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal((SHARES_TOTAL/2).toString());
            expect(await this.nft_o_logic.getSharesAvailable(deployer_address, nft_id, {from: deployer_address})).to.be.bignumber.equal((SHARES_TOTAL/2).toString());

            //6
            await this.dm_logic.registerDebt(other_user, "1", "300000", "136", SHARES_TOTAL.toString(), {from: minter_address});
        });
        it('reverting on attempt to withdraw a non-existent Stake', async () => {
            await expectRevert(this.sm_logic.withdrawStake(minter_address, "42", {from: minter_address})
                , "no NFT");
        });
        it('reverting on unauthorised attempt to withdraw a Stake for non-owner', async () => {
            await expectRevert.unspecified(this.sm_logic.withdrawStake(minter_address, "5", {from: minter_address})
                , "This user has staked nothing");
        });
        it('reverting on unauthorised attempt to withdraw a Stake for not authorised operator', async () => {
            await expectRevert.unspecified(this.sm_logic.withdrawStake(deployer_address, "5", {from: minter_address})
                , "msg.sender is not approved");
        });
        it('reverting on unauthorised attempt to withdraw a Stake for non-Stake nft', async () => {
            //6 - is a Debt nft
            await expectRevert.unspecified(this.sm_logic.withdrawStake(other_user, "6", {from: other_user})
                , "This is not a stake id");
        });
        it('reverting on attempt to delete a Project with Stakes, no Debt no Revenue', async () => {
            await this.dm_logic.payoutIndividualDebt("6", {from: minter_address});
            await expectRevert(this.pc_logic.deleteProject(other_user, "1", {from: other_user})
                , "Project has stakes");
        });
        it('creating Revenue instance for Stake testing', async () => {
            await this.rm_logic.registerRevenue("1", "3000", {from: minter_address});
            let total = await this.rm_logic.getProjectRevenuesToDistribute("1", {from: other_user});
            assert.equal(total.toString(), "3000");

        });

        it('checking stake ids before withdraw', async () => {
            const stake_ids = await this.sm_logic.getProjectStakeIds("1", {from: other_user});
            assert.equal(stake_ids.length, 3);
            assert.equal(stake_ids[0].toString(), 3);
            assert.equal(stake_ids[1].toString(), 4);
            assert.equal(stake_ids[2].toString(), 5);
        });
        it('recording balances before withdraw', async () => {
            other_user_balance = await this.token_logic.balanceOf(other_user);
            company_account_balance = await this.token_logic.balanceOf(minter_address); //company address
        });
        it('withdrawing a Stake with a single owner and no withdrawal fee', async () => {
            let total_stakes = await this.pc_logic.getProjectStakesAvailable("1", {from: other_user});
            assert.equal(total_stakes.toString(), "1000");

            let txResult = await this.sm_logic.withdrawStake(other_user, "3", {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Withdrawn', {
                for_: other_user,
                project_id: "1",
                stake_id : "3",
                amount : "300"
            });

            total_stakes = await this.pc_logic.getProjectStakesAvailable("1", {from: other_user});
            assert.equal(total_stakes.toString(), "700");

            const burned = await this.nft_c_logic.isNftBurned("3", {from: other_user});
            assert.equal(burned, true);
        });
        it('check and record balances after withdraw', async () => {
            let stake_size = new BN ("300");

            let token_balance = await this.token_logic.balanceOf(other_user);
            expect(token_balance).to.be.bignumber.equal(other_user_balance.add(stake_size));

            token_balance = await this.token_logic.balanceOf(minter_address); //company address
            expect(token_balance).to.be.bignumber.equal(company_account_balance.sub(stake_size));
        });
        it('reverting on authorised attempt to set a withdrawal fee', async () => {
            await expectRevert.unspecified(this.sm_logic.setWithdrawalFee("3000", {from: other_user}));
        });
        it('getting a withdrawal fee before it is set', async () => {
            const fee = await this.sm_logic.getWithdrawalFee({from: minter_address});
            assert.equal(fee.toString(), "0");
        });
        it('setting a withdrawal fee', async () => {
            let txResult = await this.sm_logic.setWithdrawalFee("3000", {from: minter_address}); //30%
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'WithdrawalFeeChanged', {
                by: minter_address,
                fee_in_pips: "3000"
            });
        });
        it('getting a withdrawal fee after it is set', async () => {
            const fee = await this.sm_logic.getWithdrawalFee({from: minter_address});
            assert.equal(fee.toString(), "3000");
        });
        it('checking stake ids before withdraw', async () => {
            const stake_ids = await this.sm_logic.getProjectStakeIds("1", {from: other_user});
            assert.equal(stake_ids.length, 2);
            assert.equal(stake_ids[0].toString(), 5);
            assert.equal(stake_ids[1].toString(), 4);
        });
        it('recording balances before withdraw', async () => {
            digital_investor_balance = await this.token_logic.balanceOf(digital_investor);
            company_account_balance = await this.token_logic.balanceOf(minter_address); //company address
        });
        it('withdrawing a Stake with a single owner and withdrawal fee set', async () => {
            let total_stakes = await this.pc_logic.getProjectStakesAvailable("1", {from: digital_investor});
            assert.equal(total_stakes.toString(), "700");

            let txResult = await this.sm_logic.withdrawStake(digital_investor, "4", {from: digital_investor});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Withdrawn', {
                for_: digital_investor,
                project_id: "1",
                stake_id : "4",
                amount : "210"
            });

            total_stakes = await this.pc_logic.getProjectStakesAvailable("1", {from: digital_investor});
            assert.equal(total_stakes.toString(), "490");

            const burned = await this.nft_c_logic.isNftBurned("4", {from: digital_investor});
            assert.equal(burned, true);
        });
        it('check and record balances after withdraw', async () => {
            let stake_size = new BN ("210");

            let token_balance = await this.token_logic.balanceOf(digital_investor);
            expect(token_balance).to.be.bignumber.equal(digital_investor_balance.add(stake_size));

            token_balance = await this.token_logic.balanceOf(minter_address); //company address
            expect(token_balance).to.be.bignumber.equal(company_account_balance.sub(stake_size));
        });
        it('checking stake ids before withdraw', async () => {
            const stake_ids = await this.sm_logic.getProjectStakeIds("1", {from: other_user});
            assert.equal(stake_ids.length, 2);
            assert.equal(stake_ids[0].toString(), 5);
            assert.equal(stake_ids[1].toString(), 7);
        });
        it('recording balances before withdraw', async () => {
            other_user_balance = await this.token_logic.balanceOf(other_user);
            deployer_address_balance = await this.token_logic.balanceOf(deployer_address);
            company_account_balance = await this.token_logic.balanceOf(minter_address); //company address
        });
        it('withdrawing a Stake with a multiple owners and withdrawal fee set by Owner 1', async () => {
            let total_stakes = await this.pc_logic.getProjectStakesAvailable("1", {from: other_user});
            assert.equal(total_stakes.toString(), "490");

            let txResult = await this.sm_logic.withdrawStake(other_user, "5", {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Withdrawn', {
                for_: other_user,
                project_id: "1",
                stake_id : "5",
                amount : "140"
            });

            total_stakes = await this.pc_logic.getProjectStakesAvailable("1", {from: other_user});
            assert.equal(total_stakes.toString(), "350");

            const burned = await this.nft_c_logic.isNftBurned("5", {from: other_user});
            assert.equal(burned, false);
        });
        it('withdrawing a Stake with a multiple owners and withdrawal fee set by Owner 2 (!!! now having 100% of ownership)', async () => {
            let total_stakes = await this.pc_logic.getProjectStakesAvailable("1", {from: deployer_address});
            assert.equal(total_stakes.toString(), "350");

            let txResult = await this.sm_logic.withdrawStake(deployer_address, "5", {from: deployer_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Withdrawn', {
                for_: deployer_address,
                project_id: "1",
                stake_id : "5",
                amount : "280"
            });

            total_stakes = await this.pc_logic.getProjectStakesAvailable("1", {from: deployer_address});
            assert.equal(total_stakes.toString(), "70");

            const burned = await this.nft_c_logic.isNftBurned("5", {from: deployer_address});
            assert.equal(burned, true);
        });
        it('check and record balances after withdraw', async () => {
            let stake_size_user1 = new BN ("140");
            let stake_size_user2 = new BN ("280");
            let stake_size_total = new BN ("420");

            let token_balance = await this.token_logic.balanceOf(deployer_address);
            expect(token_balance).to.be.bignumber.equal(deployer_address_balance.add(stake_size_user2));

            token_balance = await this.token_logic.balanceOf(other_user);
            expect(token_balance).to.be.bignumber.equal(other_user_balance.add(stake_size_user1));

            token_balance = await this.token_logic.balanceOf(minter_address); //company address
            expect(token_balance).to.be.bignumber.equal(company_account_balance.sub(stake_size_total));
        });
        it('checking stake ids after withdraw', async () => {
            const stake_ids = await this.sm_logic.getProjectStakeIds("1", {from: other_user});
            assert.equal(stake_ids.length, 3);
            assert.equal(stake_ids[0].toString(), 9);
            assert.equal(stake_ids[1].toString(), 7);
            assert.equal(stake_ids[2].toString(), 8);

            let owners = await this.nft_o_logic.getOwnershipForNFT("7", {from: other_user});
            assert.equal(owners.length, 1);
            assert.equal(owners[0], minter_address);

            owners = await this.nft_o_logic.getOwnershipForNFT("8", {from: other_user});
            assert.equal(owners.length, 1);
            assert.equal(owners[0], minter_address);

            owners = await this.nft_o_logic.getOwnershipForNFT("9", {from: other_user});
            assert.equal(owners.length, 1);
            assert.equal(owners[0], minter_address);
        });
    });
});
