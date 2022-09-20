const { expectEvent, expectRevert, singletons, constants, BN, bignumber, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect, assert} = require('chai');
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

contract('Project Management - BRD', ([registryFunder, deployer_address, other_user, admin_address, minter_address]) => {

    const initialSupply = new BN('10000000000000000000000');
    const maxSupply     = new BN('20000000000000000000000');
    const t_name = 'HollywoodLandToken';
    const t_symbol = 'HWLT';
    const token_price = new BN('100');

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
            await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

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

            // await this.pc_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            // await this.pc_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            // await this.pc_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            // await this.pc_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            // await this.pc_logic.setStakesManager(this.sm_logic.address, {from:minter_address}

            await this.gt_logic.setERC777(this.token_logic.address, {from:minter_address});
            await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
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
        it('reverting on incomplete setup', async () => {
            await expectRevert(this.pc_logic.createProject(
                    other_user,
                    "Test project",
                    "Completed",
                    "Distribution",
                    "100",
                    {from: deployer_address})
                , 'Setup is not ok');
        });
        it ('reverting on unauthorised setting up NFT Catalog', async () => {
            await expectRevert.unspecified(
                this.pc_logic.setNFTCatalog(this.nft_c_logic.address, {from:deployer_address}));
        });
        it ('setting up an NFT Catalog', async () => {
            let txResult = await this.pc_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTCatalogSet', {
                nft_catalog: this.nft_c_logic.address,
            });
        });
        it ('reverting on unauthorised setting up NFT Ownership', async () => {
            await expectRevert.unspecified(
                this.pc_logic.setNFTOwnership(this.nft_o_logic.address, {from:deployer_address}));
        });
        it ('setting up an NFT Ownership', async () => {
            let txResult = await this.pc_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTOwnershipSet', {
                nft_ownership: this.nft_o_logic.address,
            });
        });
        it ('reverting on unauthorised setting up DebtManager', async () => {
            await expectRevert.unspecified(
                this.pc_logic.setDebtManager(this.dm_logic.address, {from:deployer_address}));
        });
        it ('setting up an DebtManager', async () => {
            let txResult = await this.pc_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtManagerSet', {
                debt_manager: this.dm_logic.address,
            });
        });
        it ('reverting on unauthorised setting up RevenueManager', async () => {
            await expectRevert.unspecified(
                this.pc_logic.setRevenuesManager(this.rm_logic.address, {from:deployer_address}));
        });
        it ('setting up an RevenueManager', async () => {
            let txResult = await this.pc_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenuesManagerSet', {
                revenues_manager: this.rm_logic.address,
            });
        });
        it ('reverting on unauthorised setting up StakesManager', async () => {
            await expectRevert.unspecified(
                this.pc_logic.setStakesManager(this.sm_logic.address, {from:deployer_address}));
        });
        it ('setting up an StakesManager', async () => {
            let txResult = await this.pc_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'StakesManagerSet', {
                stakes_manager: this.sm_logic.address,
            });
        });
        it ('check that setup is complete', async () => {
            await this.pc_logic.createProject(
                other_user,
                "Test project",
                "Completed",
                "Distribution",
                "100",
                {from: other_user});
            expect(await this.pc_logic.projectExists("1", {from: other_user})).to.be.true;
        });
    });
    context('project management', function () {
        describe('creating a project', function () {
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
                await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

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
            });
            it('make sure catalog doesn\'t contain projects at time 0', async () => {
                await expectRevert(this.nft_o_logic.getOwnershipForAddress(other_user, {from: other_user})
                    , "no NFTs owned");
                await expectRevert(this.nft_o_logic.getOwnershipForAddress(minter_address, {from: minter_address})
                    , "no NFTs owned");
                await expectRevert(this.nft_o_logic.getOwnershipForAddress(deployer_address, {from: deployer_address})
                    , "no NFTs owned");
            });
            it('revert on incorrect Project Type', async () => {
                await expectRevert(
                    this.pc_logic.createProject(
                        other_user,
                        "Test project",
                        "42",
                        "Script",
                        "100",
                        {from: other_user})
                    , "Invalid project_type, check getProjectTypes() entrypoint");
            });
            it('revert on incorrect Road Block', async () => {
                await expectRevert(
                    this.pc_logic.createProject(
                        other_user,
                        "Test project",
                        "Production",
                        "42",
                        "100",
                        {from: other_user})
                    , "Invalid road_block, check getRoadBlocks() entrypoint");
            });
            it('getting Project Types available', async () => {
                let types = await this.pc_logic.getProjectTypes({from: other_user});
                assert.equal(types.length, 3);
                assert.equal(types[0], "Screenplay");
                assert.equal(types[1], "Production");
                assert.equal(types[2], "Completed");
            });
            it('getting Road Blocks available', async () => {
                let blocks = await this.pc_logic.getRoadBlocks({from: other_user});
                assert.equal(blocks.length, 9);
                assert.equal(blocks[0], "Script");
                assert.equal(blocks[1], "Producer");
                assert.equal(blocks[2], "Director");
                assert.equal(blocks[3], "LineBudget");
                assert.equal(blocks[4], "Production");
                assert.equal(blocks[5], "Distribution");
                assert.equal(blocks[6], "BoxOffice");
                assert.equal(blocks[7], "Purchase");
                assert.equal(blocks[8], "Stream");
            });
            it('create successfully a project in Production stage', async () => {
                let txResult = await this.pc_logic.createProject(
                    other_user,
                    "Test project",
                    "Production",
                    "Script",
                    "100",
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'ProjectCreated', {
                    by_address: other_user,
                    name : "Test project",
                    id : "1",
                });
            });
            it('create successfully a project in Completed stage', async () => {
                let txResult = await this.pc_logic.createProject(
                    other_user,
                    "Test project",
                    "Completed",
                    "Distribution",
                    "100",
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'ProjectCreated', {
                    by_address: other_user,
                    name : "Test project",
                    id : "2",
                });
            });
            it('checking ownership after the projects were created', async () => {
                await expectRevert(this.nft_o_logic.getOwnershipForAddress(minter_address, {from: minter_address})
                    , "no NFTs owned");
                await expectRevert(this.nft_o_logic.getOwnershipForAddress(deployer_address, {from: deployer_address})
                    , "no NFTs owned");

                let ids = await this.nft_o_logic.getOwnershipForAddress(other_user, {from: other_user});
                assert.equal(ids.length, 2);
                assert.equal(ids[0], "1");
                assert.equal(ids[1], "2");
            });
            it('checking projects exist in Product Catalog ', async () => {
                expect(await this.pc_logic.projectExists("1", {from: other_user})).to.be.true;
                expect(await this.pc_logic.projectExists("2", {from: other_user})).to.be.true;

                await expectRevert(this.pc_logic.projectExists("42", {from: other_user})
                    , "no NFT");
            });
            it('checking projects exist in NFT Catalog', async () => {
                await expectRevert(this.nft_c_logic.getNFT("42", {from: other_user})
                    , "no NFT");

                let nft = await this.nft_c_logic.getNFT("1", {from: other_user});
                assert.equal(nft._type, "0"); //"Project", or use a func from NFT_Helpers.sol
                nft = await this.nft_c_logic.getNFT("2", {from: deployer_address});
                assert.equal(nft._type, "0"); //"Project", or use a func from NFT_Helpers.sol
            });
        });
        describe('managing a project', function () {
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
                await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

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

                await this.pc_logic.createProject(
                    other_user,
                    "Test Production project",
                    "Production",
                    "Script",
                    "100",
                    {from: other_user});
                await this.pc_logic.createProject(
                    other_user,
                    "Test Completed project",
                    "Completed",
                    "Distribution",
                    "100",
                    {from: other_user});
            });
            it('get Road Block', async () => {
                let rb = await this.pc_logic.getRoadBlock("1", {from: other_user});
                expect(await (rb)).to.be.bignumber.equal("0");
                rb = await this.pc_logic.getRoadBlock("2", {from: other_user});
                expect(await (rb)).to.be.bignumber.equal("5");
            });
            it('revert on wrong project id', async () => {
                await expectRevert(this.pc_logic.getRoadBlock("42", {from: other_user})
                    , "no NFT");
            });
            it('revert on attempt to move a RoadBlock for non-owned project', async () => {
                await expectRevert(this.pc_logic.nextRoadBlock(deployer_address, "1", {from: deployer_address})
                    , "Must be an owner to manage a project");
            });
            it('revert on unauthorised attempt to move a RoadBlock', async () => {
                await expectRevert(this.pc_logic.nextRoadBlock(other_user, "1", {from: deployer_address})
                    , "msg.sender is not approved");
            });
            it('move RoadBlock for Production', async () => {
                const blocks = await this.pc_logic.getRoadBlocks({from: other_user});
                for (let i = 1; i < blocks.length; ++i) {
                    let txResult = await this.pc_logic.nextRoadBlock(other_user, "1", {from: other_user});
                    const {logs} = txResult;
                    expectEvent.inLogs(logs, 'ProjectRoadBlockShifted', {
                        by_address: other_user,
                        id : "1",
                    });
                    let rb = await this.pc_logic.getRoadBlock("1", {from: other_user});
                    expect(await (rb)).to.be.bignumber.equal(i.toString());
                }
            });
            it('move RoadBlock for Completed', async () => {
                const blocks = await this.pc_logic.getRoadBlocks({from: other_user});
                for (let i = 6; i < blocks.length; ++i) {
                    let txResult = await this.pc_logic.nextRoadBlock(other_user, "2", {from: other_user});
                    const {logs} = txResult;
                    expectEvent.inLogs(logs, 'ProjectRoadBlockShifted', {
                        by_address: other_user,
                        id : "2",
                    });
                    let rb = await this.pc_logic.getRoadBlock("2", {from: other_user});
                    expect(await (rb)).to.be.bignumber.equal(i.toString());
                }
            });
            it('revert on attempt to move a RoadBlock out of bounds', async () => {
                await expectRevert(this.pc_logic.nextRoadBlock(other_user, "1", {from: other_user})
                    , "Can't move forward a Roadblock");
                await expectRevert(this.pc_logic.nextRoadBlock(other_user, "2", {from: other_user})
                    , "Can't move forward a Roadblock");
            });
        });
        describe('removing a project', function () {
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
                await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

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

                await this.pc_logic.createProject(
                    other_user,
                    "Test Production project",
                    "Production",
                    "Stream",
                    "100",
                    {from: other_user});
                await this.pc_logic.createProject(
                    other_user,
                    "Test Completed project",
                    "Completed",
                    "Stream",
                    "100",
                    {from: other_user});
            });
            it('revert on attempt to delete a non-existing project', async () => {
                await expectRevert(this.pc_logic.deleteProject(minter_address, "42", {from: minter_address})
                    , "no NFT");
            });
            it('revert on attempt to delete a non-owned project', async () => {
                await expectRevert(this.pc_logic.deleteProject(deployer_address, "1", {from: deployer_address})
                    , "Must be an owner to manage a project");
            });
            it('revert on unauthorised attempt to delete a project', async () => {
                await expectRevert(this.pc_logic.deleteProject(other_user, "1", {from: deployer_address})
                    , "msg.sender is not approved");
            });
            it('delete first project successfully', async () => {
                let ids = await this.nft_o_logic.getOwnershipForAddress(other_user, {from: other_user});
                assert.equal(ids.length, 2);
                assert.equal(ids[0], "1");
                assert.equal(ids[1], "2");
                expect(await this.pc_logic.projectExists("1", {from: other_user})).to.be.true;
                expect(await this.pc_logic.projectExists("2", {from: other_user})).to.be.true;

                let txResult = await this.pc_logic.deleteProject(other_user, "1", {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'ProjectDeleted', {
                    by_address: other_user,
                    id : "1",
                });

                ids = await this.nft_o_logic.getOwnershipForAddress(other_user, {from: other_user});
                assert.equal(ids.length, 1);
                assert.equal(ids[0], "2");
                await expectRevert(this.pc_logic.projectExists("1", {from: other_user})
                    , "no NFT");
            });
            it('delete second project successfully', async () => {
                let ids = await this.nft_o_logic.getOwnershipForAddress(other_user, {from: other_user});
                assert.equal(ids.length, 1);
                assert.equal(ids[0], "2");
                expect(await this.pc_logic.projectExists("2", {from: other_user})).to.be.true;

                let txResult = await this.pc_logic.deleteProject(other_user, "2", {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'ProjectDeleted', {
                    by_address: other_user,
                    id : "2",
                });

                await expectRevert(this.nft_o_logic.getOwnershipForAddress(other_user, {from: other_user})
                    , "no NFTs owned");
                await expectRevert(this.pc_logic.projectExists("2", {from: other_user})
                    , "no NFT");
            });
        });
    });
    context('budget management', function () {
        describe('creating a budget', function () {
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

                await this.pc_logic.createProject(
                    other_user,
                    "Test Production project",
                    "Production",
                    "Stream",
                    "100",
                    {from: other_user});
                await this.pc_logic.createProject(
                    other_user,
                    "Test Completed project",
                    "Completed",
                    "Stream",
                    "100",
                    {from: other_user});
            });
            it('reverting on no Project', async () => {
                await expectRevert(this.pc_logic.registerProjectBudget(
                    other_user,
                    "42", //id
                    "1000", //budget
                    "3500", //cast and crew share in pips
                    {from: other_user}),
                    "no NFT");
            });
            it('reverting on unauthorized attempt by non-Operator', async () => {
                await expectRevert(this.pc_logic.registerProjectBudget(
                        other_user,
                        "1", //id
                        "1000", //budget
                        "3500", //cast and crew share in pips
                        {from: deployer_address}),
                    "msg.sender is not approved");
            });
            it('reverting on unauthorized attempt by non-Owner', async () => {
                await expectRevert(this.pc_logic.registerProjectBudget(
                        deployer_address,
                        "1", //id
                        "1000", //budget
                        "3500", //cast and crew share in pips
                        {from: deployer_address}),
                    "Must be an owner to manage a project");
            });
            it('creating Project Budget successfully', async () => {
                let txResult = await this.pc_logic.registerProjectBudget(
                    other_user,
                    "1", //id
                    "1000", //budget
                    "3500", //cast and crew share in pips
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'ProjectBudgetCreated', {
                    by: other_user,
                    project_id: "1",
                });
                expect(await this.pc_logic.getProjectBudgetTotal("1")).to.be.bignumber.equal("1000");
            });
            it('reverting on reentrance attempt', async () => {
                await expectRevert(this.pc_logic.registerProjectBudget(
                        other_user,
                        "1", //id
                        "1000", //budget
                        "3500", //cast and crew share in pips
                        {from: other_user}),
                    "Project budget already exists");
            });
        });
        describe('managing a budget', function () {
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
                await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

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

                await this.pc_logic.createProject(
                    other_user,
                    "Test Production project",
                    "Production",
                    "Stream",
                    "100",
                    {from: other_user});
                await this.pc_logic.createProject(
                    other_user,
                    "Test Completed project",
                    "Completed",
                    "Stream",
                    "100",
                    {from: other_user});
                await this.pc_logic.registerProjectBudget(
                    other_user,
                    "2", //id
                    "1000", //budget
                    "3500", //cast and crew share in pips
                    {from: other_user});
            });
            it('reverting on no Project', async () => {
                await expectRevert(this.pc_logic.updateProjectBudget(
                        other_user,
                        "42", //id
                        "1000", //budget
                        "3500", //cast and crew share in pips
                        {from: other_user}),
                    "no NFT");
            });
            it('reverting on unauthorized attempt by non-Operator', async () => {
                await expectRevert(this.pc_logic.updateProjectBudget(
                        other_user,
                        "2", //id
                        "1000", //budget
                        "3500", //cast and crew share in pips
                        {from: deployer_address}),
                    "msg.sender is not approved");
            });
            it('reverting on unauthorized attempt by non-Owner', async () => {
                await expectRevert(this.pc_logic.updateProjectBudget(
                        deployer_address,
                        "2", //id
                        "1000", //budget
                        "3500", //cast and crew share in pips
                        {from: deployer_address}),
                    "Must be an owner to manage a project");
            });
            it('reverting on existing Project with no Project Budget', async () => {
                await expectRevert(this.pc_logic.updateProjectBudget(
                        other_user,
                        "1", //id
                        "1000", //budget
                        "3500", //cast and crew share in pips
                        {from: other_user}),
                    "Project budget either doesn't exist or is closed");
            });
            it('updating Project Budget successfully', async () => {
                const txResult = await this.pc_logic.updateProjectBudget(
                    other_user,
                    "2", //id
                    "2000", //budget
                    "5000", //cast and crew share in pips
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'ProjectBudgetUpdated', {
                    by: other_user,
                    project_id: "2",
                });
                expect(await this.pc_logic.getProjectBudgetTotal("2")).to.be.bignumber.equal("2000");
            });
        });
        describe('closing a budget', function () {
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
                await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

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

                await this.pc_logic.createProject(
                    other_user,
                    "Test Production project",
                    "Production",
                    "Stream",
                    "100",
                    {from: other_user});
                await this.pc_logic.createProject(
                    other_user,
                    "Test Completed project",
                    "Completed",
                    "Stream",
                    "100",
                    {from: other_user});
                await this.pc_logic.registerProjectBudget(
                    other_user,
                    "2", //id
                    "1000", //budget
                    "3500", //cast and crew share in pips
                    {from: other_user});
            });
            it('reverting on no Project', async () => {
                await expectRevert(this.pc_logic.closeProjectBudget(
                        other_user,
                        "42", //id
                        {from: other_user}),
                    "no NFT");
            });
            it('reverting on unauthorized attempt by non-Operator', async () => {
                await expectRevert(this.pc_logic.closeProjectBudget(
                        other_user,
                        "2", //id
                        {from: deployer_address}),
                    "msg.sender is not approved");
            });
            it('reverting on unauthorized attempt by non-Owner', async () => {
                await expectRevert(this.pc_logic.closeProjectBudget(
                        deployer_address,
                        "2", //id
                        {from: deployer_address}),
                    "Must be an owner to manage a project");
            });
            it('reverting on existing Project with no Project Budget', async () => {
                await expectRevert(this.pc_logic.closeProjectBudget(
                        other_user,
                        "1", //id
                        {from: other_user}),
                    "Project budget either doesn't exist or is closed");
            });
            it('closing Project Budget successfully', async () => {
                const txResult = await this.pc_logic.closeProjectBudget(
                    other_user,
                    "2", //id
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'ProjectBudgetClosed', {
                    by: other_user,
                    project_id: "2",
                });
                await expectRevert(this.pc_logic.getProjectBudgetTotal("2")
                    , "Project budget either doesn't exist or is closed")
            });
            it('reverting on reentrance attempt', async () => {
                await expectRevert(this.pc_logic.closeProjectBudget(
                        other_user,
                        "2", //id
                        {from: other_user}),
                    "Project budget either doesn't exist or is closed");
            });
        });
    });
});
