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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

contract('NFT Management - BRD', ([registryFunder, deployer_address, other_user, admin_address, minter_address, digital_investor]) => {

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

            // await this.nft_c_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            // await this.nft_c_logic.setNFT_TransactionPool(this.nft_t_logic.address, {from:minter_address});
            // await this.nft_t_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            // await this.nft_t_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            // await this.nft_o_logic.setNFT_TransactionPool(this.nft_t_logic.address, {from:minter_address});
            // await this.nft_o_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});

            // await this.nft_c_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            // await this.nft_c_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            // await this.nft_c_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            // await this.nft_c_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            // await this.nft_c_logic.setERC777(this.token_logic.address, {from:minter_address});
            // await this.nft_c_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});

            // await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            // await this.nft_o_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            // await this.nft_o_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            // await this.nft_o_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            // await this.nft_o_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});

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

        it('TxPool reverting on incomplete setup', async () => {
                await expectRevert(this.nft_t_logic.getTransactionFee("1", {from: other_user})
                , "Setup is not ok");
        });
        it('TxPool reverting on unauthorised setting up NFT Catalog', async () => {
            await expectRevert.unspecified(
                this.nft_t_logic.setNFTCatalog(this.nft_c_logic.address, {from:deployer_address}));
        });
        it('TxPool setting up NFT Catalog', async () => {
            let txResult = await this.nft_t_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTCatalogSet', {
                nft_catalog: this.nft_c_logic.address,
            });
        });
        it('TxPool reverting on unauthorised setting up NFT Ownership', async () => {
            await expectRevert.unspecified(
                this.nft_t_logic.setNFTOwnership(this.nft_o_logic.address, {from:deployer_address}));
        });
        it('TxPool setting up NFT Ownership', async () => {
            let txResult = await this.nft_t_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTOwnershipSet', {
                nft_ownership: this.nft_o_logic.address,
            });
        });
        it('TxPool check that setup is complete', async () => {
            //setup is ok, but no NFT
            await expectRevert(this.nft_t_logic.getTransactionFee("1", {from: other_user})
                , "no NFT");
        });

        it('Ownership reverting on incomplete setup', async () => {
            await expectRevert(this.nft_o_logic.getTotalSharesForNFT("1", {from: other_user})
                , "Setup is not ok");
        });
        it('Ownership reverting on unauthorised setting up NFT Catalog', async () => {
            await expectRevert.unspecified(
                this.nft_o_logic.setNFTCatalog(this.nft_c_logic.address, {from:deployer_address}));
        });
        it('Ownership setting up NFT Catalog', async () => {
            let txResult = await this.nft_o_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTCatalogSet', {
                nft_catalog: this.nft_c_logic.address,
            });
        });
        it('Ownership reverting on unauthorised setting up NFT TxPool', async () => {
            await expectRevert.unspecified(
                this.nft_o_logic.setNFT_TransactionPool(this.nft_t_logic.address, {from:deployer_address}));
        });
        it('Ownership setting up NFT TxPool', async () => {
            let txResult = await this.nft_o_logic.setNFT_TransactionPool(this.nft_t_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFT_TransactionPoolSet', {
                nft_tx_pool: this.nft_t_logic.address,
            });
        });
        it('Ownership reverting on unauthorised setting up DebtManager', async () => {
            await expectRevert.unspecified(
                this.nft_o_logic.setDebtManager(this.dm_logic.address, {from:deployer_address}));
        });
        it('Ownership setting up DebtManager', async () => {
            let txResult = await this.nft_o_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtManagerSet', {
                debt_manager: this.dm_logic.address,
            });
        });
        it('Ownership reverting on unauthorised setting up RevenueManager', async () => {
            await expectRevert.unspecified(
                this.nft_o_logic.setRevenuesManager(this.rm_logic.address, {from:deployer_address}));
        });
        it('Ownership setting up RevenueManager', async () => {
            let txResult = await this.nft_o_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenuesManagerSet', {
                revenues_manager: this.rm_logic.address,
            });
        });
        it('Ownership reverting on unauthorised setting up StakesManager', async () => {
            await expectRevert.unspecified(
                this.nft_o_logic.setStakesManager(this.sm_logic.address, {from:deployer_address}));
        });
        it('Ownership setting up StakesManager', async () => {
            let txResult = await this.nft_o_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'StakesManagerSet', {
                stakes_manager: this.sm_logic.address,
            });
        });
        it('Ownership reverting on unauthorised setting up ProjectCatalog', async () => {
            await expectRevert.unspecified(
                this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:deployer_address}));
        });
        it('Ownership setting up ProjectCatalog', async () => {
            let txResult = await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ProjectCatalogSet', {
                project_catalog: this.pc_logic.address,
            });
        });
        it('Ownership reverting on unauthorised setting up Governance Token', async () => {
            await expectRevert.unspecified(
                this.nft_o_logic.setGovernanceToken(this.gt_logic.address, {from:deployer_address}));
        });
        it('Ownership setting up GovernanceToken', async () => {
            let txResult = await this.nft_o_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'GovernanceTokenSet', {
                governance_token: this.gt_logic.address,
            });
        });
        it('Ownership check that setup is complete', async () => {
            //setup is ok, but no NFT
            await expectRevert(this.nft_o_logic.getTotalSharesForNFT("1", {from: other_user})
                , "no NFT");
        });

        it('Catalog reverting on incomplete setup', async () => {
            await expectRevert(this.nft_c_logic.mint(
                    other_user,
                    "ProjectArt",
                    "www.google.com",
                    0,
                    0,
                    0,
                    100, {from: other_user})
                , "Setup is not ok");
        });
        it('Catalog reverting on unauthorised setting up NFT TxPool', async () => {
            await expectRevert.unspecified(
                this.nft_c_logic.setNFT_TransactionPool(this.nft_t_logic.address, {from:deployer_address}));
        });
        it('Catalog setting up NFT Transaction Pool', async () => {
            let txResult = await this.nft_c_logic.setNFT_TransactionPool(this.nft_t_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFT_TransactionPoolSet', {
                nft_tx_pool: this.nft_t_logic.address,
            });
        });
        it('Catalog reverting on unauthorised setting up NFT Ownership', async () => {
            await expectRevert.unspecified(
                this.nft_c_logic.setNFTOwnership(this.nft_o_logic.address, {from:deployer_address}));
        });
        it('Catalog setting up NFT Ownership', async () => {
            let txResult = await this.nft_c_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTOwnershipSet', {
                nft_ownership: this.nft_o_logic.address,
            });
        });
        it('Catalog reverting on unauthorised setting up DebtManager', async () => {
            await expectRevert.unspecified(
                this.nft_c_logic.setDebtManager(this.dm_logic.address, {from:deployer_address}));
        });
        it('Catalog setting up DebtManager', async () => {
            let txResult = await this.nft_c_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtManagerSet', {
                debt_manager: this.dm_logic.address,
            });
        });
        it('Catalog reverting on unauthorised setting up RevenueManager', async () => {
            await expectRevert.unspecified(
                this.nft_c_logic.setRevenuesManager(this.rm_logic.address, {from:deployer_address}));
        });
        it('Catalog setting up RevenueManager', async () => {
            let txResult = await this.nft_c_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'RevenuesManagerSet', {
                revenues_manager: this.rm_logic.address,
            });
        });
        it('Catalog reverting on unauthorised setting up StakesManager', async () => {
            await expectRevert.unspecified(
                this.nft_c_logic.setStakesManager(this.sm_logic.address, {from:deployer_address}));
        });
        it('Catalog setting up StakesManager', async () => {
            let txResult = await this.nft_c_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'StakesManagerSet', {
                stakes_manager: this.sm_logic.address,
            });
        });
        it('Catalog reverting on unauthorised setting up ERC777', async () => {
            await expectRevert.unspecified(
                this.nft_c_logic.setERC777(this.token_logic.address, {from:deployer_address}));
        });
        it('Catalog setting up ERC777', async () => {
            let txResult = await this.nft_c_logic.setERC777(this.token_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ERC777Set', {
                token: this.token_logic.address,
            });
        });
        it('Catalog reverting on unauthorised setting up ProjectCatalog', async () => {
            await expectRevert.unspecified(
                this.nft_c_logic.setProjectCatalog(this.pc_logic.address, {from:deployer_address}));
        });
        it('Catalog setting up ProjectCatalog', async () => {
            let txResult = await this.nft_c_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ProjectCatalogSet', {
                project_catalog: this.pc_logic.address,
            });
        });
        it('Catalog reverting on unauthorised setting up Governance Token', async () => {
            await expectRevert.unspecified(
                this.nft_c_logic.setGovernanceToken(this.gt_logic.address, {from:deployer_address}));
        });
        it('Catalog setting up GovernanceToken', async () => {
            let txResult = await this.nft_c_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'GovernanceTokenSet', {
                governance_token: this.gt_logic.address,
            });
        });

        it('Catalog check that setup is complete', async () => {
            const txResult = await this.nft_c_logic.mint(
                other_user,
                "ProjectArt",
                "www.google.com",
                0,
                0,
                0,
                100, {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTMinted', {
                by: other_user,
                project_id: "0",
                collection_id: "0",
                nft_id: "1"
            });
        });
    });
    context('nft creation', function () {
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
        });
        it('Any NFT reverting on creating through NFT Ownership', async () => {
            await expectRevert(this.nft_o_logic.startOwnership(
                    other_user,
                    other_user,
                    "1",
                    100,
                    {from: other_user})
                , "Not a system call");
        });
        it('Any NFT reverting on non-existing NFT Type', async () => {
            await expectRevert(this.nft_c_logic.mint(
                    other_user,
                    "UnknownType",
                    "www.google.com",
                    "0",
                    "0",
                    "100",
                    "100",
                    {from: other_user})
                , "Invalid nft_type, check getNftTypes() entrypoint");
        });

        it('Project reverting on creating through NFT Catalog', async () => {
            await expectRevert(this.nft_c_logic.mint(
                    other_user,
                    "Project",
                    "www.google.com",
                    0,
                    0,
                    0,
                    100, {from: other_user})
                , "use Project Catalog");
        });
        it('Project reverting on zero shares', async () => {
            await expectRevert(this.pc_logic.createProject(
                other_user,
                "Test project",
                "Production",
                "Stream",
                "0",
                {from: other_user})
                , "Shares can't be 0");
        });
        it('Project 1st successfully create through ProjectCatalog', async () => {
            let txResult = await this.pc_logic.createProject(
                other_user,
                "Test project",
                "Production",
                "Stream",
                "100",
                {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ProjectCreated', {
                by_address: other_user,
                name : "Test project",
                id : "1",
            });
        });
        it('Project confirming ownership for User 1', async () => {
            expect (await this.nft_o_logic.isOwner(other_user, "1")).to.be.true;
        });

        it('Stake reverting on creating through NFT Catalog', async () => {
            await expectRevert(this.nft_c_logic.mint(
                    other_user,
                    "Stake",
                    "www.google.com",
                    0,
                    0,
                    100,
                    100, {from: other_user})
                , "use Stakes Manager");
        });
        it('Stake reverting on creating with no Project', async () => {
            await expectRevert(this.sm_logic.stake(
                    other_user,
                    "42",
                    "0",
                    "100",
                    {from: other_user})
                , "no NFT");
        });
        it('Stake reverting on not enough Tokens in User\'s wallet', async () => {
            await expectRevert(this.sm_logic.stake(
                    other_user,
                    "42",
                    "1",
                    "100",
                    {from: other_user})
                , "Not enough tokens in the wallet");
        });
        it('Stake checking users\' balances', async () => {
            await this.token_logic.registerAddress(other_user, {from: minter_address});
            await this.token_logic.registerAddress(digital_investor, {from: minter_address});

            let updated_amount = await web3.utils.fromWei(amount, 'wei');
            await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
            let user_balance = await this.token_logic.balanceOf(other_user);
            assert.equal(user_balance.toString(), '4200');

            updated_amount = await web3.utils.fromWei(new BN('84'), 'wei');
            await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});
            user_balance = await this.token_logic.balanceOf(digital_investor);
            assert.equal(user_balance.toString(), '8400');
        });
        it('Stake reverting on absent Project Budget', async () => {
            await expectRevert(this.sm_logic.stake(
                    other_user,
                    "42",
                    "1",
                    "100",
                    {from: other_user})
                , "Project budget either doesn't exist or is closed");
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
        it('Stake reverting on zero shares', async () => {
            await expectRevert(this.sm_logic.stake(
                    other_user,
                    "42",
                    "1",
                    "0",
                    {from: other_user})
                , "Shares can't be 0");
        });
        it('Stake reverting on excess over Project Budget', async () => {
            await expectRevert(this.sm_logic.stake(
                    other_user,
                    "2000",
                    "1",
                    "100",
                    {from: other_user})
                , "If made your stake would exceed total Project budget");
        });
        it('Stake successfully creating through StakesManager for user 1', async () => {
            let txResult = await this.sm_logic.stake(
                other_user,
                "42",
                "1",
                "100",
                {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Staked', {
                from: other_user,
                project_id: "1",
                stake_id: "2",
                amount: "42"
            });
        });
        it('Stake confirming ownership for User 1', async () => {
            //NFT ids are simple incremental, that's why it is "2"
            expect (await this.nft_o_logic.isOwner(other_user, "2")).to.be.true;
        });
        it('Stake successfully creating through StakesManager for user 2', async () => {
            let txResult = await this.sm_logic.stake(
                digital_investor,
                "52",
                "1",
                "200",
                {from: digital_investor});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'Staked', {
                from: digital_investor,
                project_id: "1",
                stake_id: "3",
                amount: "52"
            });
        });
        it('Stake confirming ownership for User 2', async () => {
            //NFT ids are simple incremental, that's why it is "3"
            expect (await this.nft_o_logic.isOwner(digital_investor, "3")).to.be.true;
        });

        it('Debt reverting on creating through NFT Catalog', async () => {
            await expectRevert(this.nft_c_logic.mint(
                    other_user,
                    "Debt",
                    "www.google.com",
                    0,
                    0,
                    100,
                    100, {from: other_user})
                , "use Debt Manager");
        });
        it('Debt reverting on unauthorised attempt', async () => {
            await expectRevert.unspecified(this.dm_logic.registerDebt(
                    other_user, //debtor
                    "42",   //project_id
                    "300",  //volume
                    "12",   //apy_rate
                    "100",  //nft_ownership_total_shares
                    {from: other_user})); //debt manager
        });
        it('Debt reverting on creating with no Project', async () => {
            await expectRevert(this.dm_logic.registerDebt(
                    other_user, //debtor
                    "42",   //project_id
                    "300",  //volume
                    "12",   //apy_rate
                    "100",  //nft_ownership_total_shares
                    {from: minter_address})  //debt manager
                , "no NFT");
        });
        it('Debt reverting on zero shares', async () => {
            await expectRevert(this.dm_logic.registerDebt(
                    other_user, //debtor
                "1",   //project_id
                "300",  //volume
                "12",   //apy_rate
                "0",  //nft_ownership_total_shares
                {from: minter_address})  //debt manager
                , "Shares can't be 0");
        });
        it('Debt successfully creating through DebtManager by DebtManagerRole for User 2', async () => {
            let txResult = await this.dm_logic.registerDebt(
                digital_investor, //debtor
                "1",   //project_id
                "300",  //volume
                "12",   //apy_rate
                "100",  //nft_ownership_total_shares
                {from: minter_address});  //debt manager
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtRegistered', {
                debtor: digital_investor,
                project_id: "1",
                debt_id : "4",
                principal: "300",
                apy_rate: "12"
            });
        });
        it('Debt confirming ownership for User 2', async () => {
            expect (await this.nft_o_logic.isOwner(digital_investor, "4")).to.be.true;
        });
        it('Debt successfully creating through DebtManager by DebtManagerRole for User 1', async () => {
            let txResult = await this.dm_logic.registerDebt(
                other_user, //debtor
                "1",   //project_id
                "100",  //volume
                "10",   //apy_rate
                "100",  //nft_ownership_total_shares
                {from: minter_address});  //debt manager
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtRegistered', {
                debtor: other_user,
                project_id: "1",
                debt_id : "5",
                principal: "100",
                apy_rate: "10"
            });
        });
        it('Debt confirming ownership for User 1', async () => {
            expect (await this.nft_o_logic.isOwner(other_user, "5")).to.be.true;
        });

        it('Project 2nd successfully created through ProjectCatalog', async () => {
            let txResult = await this.pc_logic.createProject(
                digital_investor,
                "Another test project",
                "Production",
                "Stream",
                "100",
                {from: digital_investor});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'ProjectCreated', {
                by_address: digital_investor,
                name : "Another test project",
                id : "6",
            });
        });
        it('Collection reverting on unauthorized attempt of creating Collection', async () => {
            await expectRevert(this.nft_c_logic.mint(
                    other_user,
                    "Collection",
                    "www.google.com",
                    "0",
                    "0",
                    "100",
                    "100",
                    {from: deployer_address})
                , "not approved operator");
        });
        it('Collection reverting on non-existing Project', async () => {
            await expectRevert(this.nft_c_logic.mint(
                    other_user,
                    "Collection",
                    "www.google.com",
                    "0",
                    "42",
                    "100",
                    "100",
                    {from: other_user})
                , " Non-existing Project, zero to skip");
        });
        it('Collection reverting on zero shares', async () => {
            await expectRevert(this.nft_c_logic.mint(
                    other_user,
                    "Collection",
                    "www.google.com",
                    "0",
                    "0",
                    "100",
                    "0",
                    {from: other_user})
                , "Shares can't be 0");
        });
        it('Collection successfully creating for User 1 for No Project', async () => {
            let txResult = await this.nft_c_logic.mint(
                other_user,
                "Collection",
                "www.google.com",
                "0",
                "0",
                "100",
                "100",
                {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTMinted', {
                by: other_user,
                project_id: "0",
                collection_id : "0",
                nft_id: "7",
                nft_type: "Collection"
            });
        });
        it('Collection confirming ownership for User 1', async () => {
            expect (await this.nft_o_logic.isOwner(other_user, "7")).to.be.true;
        });
        it('Collection reverting on attempt to associate with another Collection', async () => {
            await expectRevert(this.nft_c_logic.mint(
                    other_user,
                    "Collection",
                    "www.google.com",
                    "7",
                    "0",
                    "100",
                    "100",
                    {from: other_user})
                , "Collection can't be minted for Collection");
        });
        it('Collection successfully creating for User 2 for Existing Project', async () => {
            let txResult = await this.nft_c_logic.mint(
                digital_investor,
                "Collection",
                "www.google.com",
                "0",
                "1",
                "100",
                "100",
                {from: digital_investor});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTMinted', {
                by: digital_investor,
                project_id: "1",
                collection_id : "0",
                nft_id: "8",
                nft_type: "Collection"
            });
        });
        it('Collection confirming ownership for User 2', async () => {
            expect (await this.nft_o_logic.isOwner(digital_investor, "8")).to.be.true;
        });

        let types = ["ProjectArt", "Ticket", "Other"];
        let idx_of_type = 0;
        let idx_of_nft = 8;
        for (; idx_of_type !== types.length; ++idx_of_type) {
            let type = types[idx_of_type];
            it(type + ' reverting on unauthorized attempt of creating', async () => {
                await expectRevert(this.nft_c_logic.mint(
                        other_user,
                        type,
                        "www.google.com",
                        "0",
                        "0",
                        "100",
                        "100",
                        {from: deployer_address})
                    , "not approved operator");
            });
            it(type + ' reverting on zero shares', async () => {
                await expectRevert(this.nft_c_logic.mint(
                        other_user,
                        type,
                        "www.google.com",
                        "0",
                        "0",
                        "100",
                        "0",
                        {from: other_user})
                    , "Shares can't be 0");
            });
            it(type + ' reverting on non-existing Collection', async () => {
                await expectRevert(this.nft_c_logic.mint(
                        other_user,
                        type,
                        "www.google.com",
                        "42",
                        "0",
                        "100",
                        "100",
                        {from: other_user})
                    , "Non-existing Collection, zero to skip");
            });
            it(type + ' reverting on non-existing Project', async () => {
                await expectRevert(this.nft_c_logic.mint(
                        other_user,
                        type,
                        "www.google.com",
                        "0",
                        "42",
                        "100",
                        "100",
                        {from: other_user})
                    , "Non-existing Project, zero to skip");
            });
            it(type + ' reverting on Project-Collection mismatch', async () => {
                await expectRevert(this.nft_c_logic.mint(
                        other_user,
                        type,
                        "www.google.com",
                        "7",
                        "6",
                        "100",
                        "100",
                        {from: other_user})
                    , "Collection is not in the Project");
            });
            it(type + ' successfully creating for User 1 for No Project No Collection', async () => {
                ++idx_of_nft;
                const nft_id_str = idx_of_nft.toString();
                let txResult = await this.nft_c_logic.mint(
                    other_user,
                    type,
                    "www.google.com",
                    "0",
                    "0",
                    "100",
                    "100",
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'NFTMinted', {
                    by: other_user,
                    project_id: "0",
                    collection_id : "0",
                    nft_id: nft_id_str,
                    nft_type: type
                });
            });
            it(type + ' confirming ownership for User 1', async () => {
                const nft_id_str = idx_of_nft.toString();
                expect (await this.nft_o_logic.isOwner(other_user, nft_id_str)).to.be.true;
            });
            it(type + ' successfully creating for User 2 for Existing Project No Collection', async () => {
                ++idx_of_nft;
                const nft_id_str = idx_of_nft.toString();
                let txResult = await this.nft_c_logic.mint(
                    digital_investor,
                    type,
                    "www.google.com",
                    "0",
                    "1",
                    "100",
                    "100",
                    {from: digital_investor});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'NFTMinted', {
                    by: digital_investor,
                    project_id: "1",
                    collection_id : "0",
                    nft_id: nft_id_str,
                    nft_type: type
                });
            });
            it(type + ' confirming ownership for User 2', async () => {
                const nft_id_str = idx_of_nft.toString();
                expect (await this.nft_o_logic.isOwner(digital_investor, nft_id_str)).to.be.true;
            });
            it(type + ' successfully creating for User 2 for Existing Project for Existing Collection', async () => {
                ++idx_of_nft;
                const nft_id_str = idx_of_nft.toString();
                let txResult = await this.nft_c_logic.mint(
                    digital_investor,
                    type,
                    "www.google.com",
                    "8",
                    "1",
                    "100",
                    "100",
                    {from: digital_investor});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'NFTMinted', {
                    by: digital_investor,
                    project_id: "1",
                    collection_id : "8",
                    nft_id: nft_id_str,
                    nft_type: type
                });
            });
            it(type + ' confirming ownership for User 2', async () => {
                const nft_id_str = idx_of_nft.toString();
                expect (await this.nft_o_logic.isOwner(digital_investor, nft_id_str)).to.be.true;
            });
        }
        it('ownership confirmation for User 1', async () => {
            let nft_ids = await this.nft_o_logic.getOwnershipForAddress(other_user, {from: other_user});
            assert.equal(nft_ids.length, 7);
            let ids = [1, 2, 5, 7, 9, 12, 15];
            for (let i = 0; i !== ids.length; ++i) {
                assert.equal(nft_ids[i].toString(), ids[i].toString());
            }
        });
        it('ownership confirmation for User 2', async () => {
            let nft_ids = await this.nft_o_logic.getOwnershipForAddress(digital_investor, {from: digital_investor});
            assert.equal(nft_ids.length, 10);
            let ids = [3, 4, 6, 8, 10, 11, 13, 14, 16, 17];
            for (let i = 0; i !== ids.length; ++i) {
                assert.equal(nft_ids[i].toString(), ids[i].toString());
            }
        });
    });
    context('nft transfer', function () {
        const SHARES_TOTAL = 100;
        const ZERO_SHARES = "0";
        const INITIAL_TOKEN_BALANCE = "200";

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

            await this.pc_logic.createProject(other_user, "Test project", "Production", "Stream", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});

            await this.token_logic.registerAddress(other_user, {from: minter_address});
            await this.token_logic.registerAddress(digital_investor, {from: minter_address});

            let updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
            updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});

            await this.sm_logic.stake(other_user, "900", "1", SHARES_TOTAL.toString(), {from: other_user});
            await this.dm_logic.registerDebt(other_user, "1", "100", "10", SHARES_TOTAL.toString(), {from: minter_address});

            await this.nft_c_logic.mint(other_user, "Collection", "www.google.com", "0", "0", "0", SHARES_TOTAL.toString(), {from: other_user});
            await this.nft_c_logic.mint(other_user, "ProjectArt", "www.google.com", "0", "0", "0", SHARES_TOTAL.toString(), {from: other_user});
            await this.nft_c_logic.mint(other_user, "Ticket", "www.google.com", "0", "1", "0", SHARES_TOTAL.toString(), {from: other_user});
            await this.nft_c_logic.mint(other_user, "Other", "www.google.com", "4", "0",  "0", SHARES_TOTAL.toString(), {from: other_user});
        });

        it('pre-test ownership confirmation for User 1', async () => {
            let nft_ids = await this.nft_o_logic.getOwnershipForAddress(other_user, {from: other_user});
            assert.equal(nft_ids.length, 7);
            let ids = [1, 2, 3, 4, 5, 6, 7];
            for (let i = 0; i !== ids.length; ++i) {
                assert.equal(nft_ids[i].toString(), ids[i].toString());
            }
        });
        it('pre-test ownership confirmation for User 2', async () => {
            await expectRevert(this.nft_o_logic.getOwnershipForAddress(digital_investor, {from: digital_investor})
            , "no NFTs owned");
        });
        
        let types = ["ProjectArt", "Ticket", "Other", "Stake", "Debt", "Collection", "Project"];
        let nft_ids = ["5", "6", "7", "2", "3", "4", "1"]; //from simple to complicated

        let shares_to_sell = getRandomInt(20, 80);
        let shares_left = (SHARES_TOTAL - shares_to_sell);
        let price1st = getRandomInt(1, 100);
        let price2nd = getRandomInt(1, 100);
        let tx_id = 0;

        let owner_token_balance;
        let buyer_token_balance;
        let company_token_balance;
        let owner_ether_balance;
        let buyer_ether_balance;
        let company_ether_balance;

        let is_ether_payment = true;

        it('set transaction fee for a randomly selected type', async () => {
            const idx_for_fee = getRandomInt(0, 4);
            //setting a fee of 5%
            await this.nft_t_logic.setTransactionFee(types[idx_for_fee], "500", {from: minter_address});
            console.log('TX Fee is set for', types[idx_for_fee]);
        });

        let idx = 0;
        for (; idx !== types.length; ++idx) {
            const type = types[idx];
            const nft_id = nft_ids[idx];

            it(type + ' shares confirmation for both Users, transaction Not Started', async () => {
                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesBlocked(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(ZERO_SHARES);

                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: digital_investor})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
                expect(await this.nft_o_logic.getSharesAvailable(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
                expect(await this.nft_o_logic.getSharesBlocked(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
            });
            it(type + ' reverting on unauthorized attempt to approve a transaction by non-Owner', async () => {
                await expectRevert(this.nft_c_logic.approveTransaction(
                    digital_investor,
                    deployer_address,
                    nft_id,
                    shares_to_sell.toString(),
                    price1st.toString(),
                    !is_ether_payment,
                    {from: digital_investor}
                ), "owner doesn't have this NFT");
            });
            it(type + ' reverting on unauthorized attempt to approve a transaction by a third part', async () => {
                await expectRevert(this.nft_c_logic.approveTransaction(
                    other_user,
                    digital_investor,
                    nft_id,
                    shares_to_sell.toString(),
                    price1st.toString(),
                    !is_ether_payment,
                    {from: digital_investor}
                ), "not approved");
            });
            it(type + ' reverting on manually creating transaction', async () => {
                await expectRevert(this.nft_t_logic.makeTransaction(
                        other_user,
                        digital_investor,
                        nft_id,
                        shares_to_sell.toString(),
                        price1st.toString(),
                        !is_ether_payment,
                        {from: other_user})
                    , "Not a system call");
            });
            it(type + ' approving Transaction', async () => {
                ++tx_id;
                let txResult = await this.nft_c_logic.approveTransaction(
                    other_user,
                    digital_investor,
                    nft_id,
                    shares_to_sell.toString(),
                    price1st.toString(),
                    !is_ether_payment,
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'TransactionApproved', {
                    from: other_user,
                    to: digital_investor,
                    nft_id: nft_id,
                    shares: shares_to_sell.toString(),
                    price: price1st.toString(),
                    tx_id: tx_id.toString(), //separate counter, TX is not an NFT
                    payment: "tokens"
                });
            });
            it(type + ' shares confirmation for both Users, transaction Approved', async () => {
                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(shares_left.toString());
                expect(await this.nft_o_logic.getSharesBlocked(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(shares_to_sell.toString());

                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: digital_investor})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
                expect(await this.nft_o_logic.getSharesAvailable(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
                expect(await this.nft_o_logic.getSharesBlocked(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
            });
            it(type + ' reverting on unauthorized attempt to manually re-approve a transaction', async () => {
                await expectRevert(this.nft_o_logic.approveTransaction(other_user, tx_id.toString(), {from: other_user})
                    , "Not a system call");
            });
            it(type + ' reverting on another ongoing transaction for same NFT', async () => {
                await expectRevert(this.nft_c_logic.approveTransaction(
                        other_user,
                        digital_investor,
                        nft_id,
                        shares_to_sell.toString(),
                        price1st.toString(),
                        !is_ether_payment,
                        {from: other_user})
                    , "revert can't have more than one of ongoing transactions for NFT");
            });
            it(type + ' reverting on manually deleting transaction', async () => {
                // enum TransactionStatus {
                //         Created, //0
                //         Approved, //1
                //         Rejected, //2
                //         Completed //3
                //     }
                await expectRevert(this.nft_t_logic.deleteTransaction(tx_id.toString(), "2", {from: other_user})
                    , "Not a system call");
            });
            it(type + ' reverting on manually cancelling transaction', async () => {
                await expectRevert(this.nft_o_logic.cancelTransaction(other_user, tx_id.toString(), {from: other_user})
                    , "Not a system call");
            });
            it(type + ' reverting on unauthorised attempt of cancelling transaction', async () => {
                await expectRevert(this.nft_o_logic.cancelTransaction(other_user, tx_id.toString(), {from: digital_investor})
                    , "Not a system call");
            });
            it(type + ' cancelling Transaction', async () => {
                let txResult = await this.nft_c_logic.cancelTransaction(tx_id.toString(), {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'TransactionCancelled', {
                    from: other_user,
                    to: digital_investor,
                    nft_id: nft_id,
                    shares: shares_to_sell.toString(),
                    price: price1st.toString(),
                    tx_id: tx_id.toString()
                });
            });
            it(type + ' shares confirmation for both Users, transaction Cancelled', async () => {
                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesBlocked(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(ZERO_SHARES);

                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: digital_investor})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
                expect(await this.nft_o_logic.getSharesAvailable(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
                expect(await this.nft_o_logic.getSharesBlocked(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
            });
            it(type + ' reverting on attempt to implement Cancelled transaction', async () => {
                await expectRevert(this.nft_c_logic.implementTransaction(tx_id.toString(), {from: digital_investor})
                    , "Transaction is not active");
            });
            it(type + ' reverting on attempt to manually implement Cancelled transaction', async () => {
                await expectRevert(this.nft_o_logic.transferOwnership(other_user, tx_id.toString(), {from: digital_investor})
                    , "Not a system call");
            });
            it(type + ' re-approving Transaction', async () => {
                ++tx_id;
                let txResult = await this.nft_c_logic.approveTransaction(
                    other_user,
                    digital_investor,
                    nft_id,
                    shares_to_sell.toString(),
                    price1st.toString(),
                    !is_ether_payment,
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'TransactionApproved', {
                    from: other_user,
                    to: digital_investor,
                    nft_id: nft_id,
                    shares: shares_to_sell.toString(),
                    price: price1st.toString(),
                    tx_id: tx_id.toString(), //separate counter, TX is not an NFT
                    payment: "tokens"
                });
            });
            it(type + ' reverting on manually implementing transaction', async () => {
                await expectRevert(this.nft_o_logic.transferOwnership(other_user, tx_id.toString(), {from: other_user})
                    , "Not a system call");
            });
            it(type + ' recording balances before transaction', async () => {
                owner_token_balance = await this.token_logic.balanceOf(other_user);
                buyer_token_balance = await this.token_logic.balanceOf(digital_investor);
                company_token_balance = await this.token_logic.balanceOf(minter_address); //company address
            });
            it(type + ' reverting on not enough tokens for a buyer', async () => {
                await this.token_logic.send(other_user, buyer_token_balance, empty_bytes, {from: digital_investor});
                await expectRevert(this.nft_c_logic.implementTransaction(tx_id.toString(), {from: digital_investor})
                    , "no balance");
                await this.token_logic.send(digital_investor, buyer_token_balance, empty_bytes, {from: other_user});
            });
            it(type + ' implementing Transaction in tokens', async () => {
                let project_id = "0";
                let collection_id = "0";
                try {
                    project_id = await this.nft_c_logic.getProjectOfToken(nft_id, {from: other_user});
                } catch (e) {
                }
                try {
                    collection_id = await this.nft_c_logic.getCollectionOfToken(nft_id, {from: other_user});
                } catch (e) {
                }

                let txResult = await this.nft_c_logic.implementTransaction(tx_id.toString(), {from: digital_investor});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'NFTTransferred', {
                    from: other_user,
                    to: digital_investor,
                    project_id: project_id,
                    collection_id: collection_id,
                    nft_id: nft_id,
                    nft_type: type,
                });
                expectEvent.inLogs(logs, 'TransactionImplemented', {
                    from: other_user,
                    to: digital_investor,
                    nft_id: nft_id,
                    shares: shares_to_sell.toString(),
                    price: price1st.toString(),
                    tx_id: tx_id.toString()
                });
            });
            it(type + ' check and record balances after token transaction', async () => {
                const fee_to_keep = await this.nft_t_logic.getTransactionFeeTX(tx_id, {from: other_user});
                let _price = new BN(price1st.toString());
                let value = _price.sub(fee_to_keep);

                let token_balance = await this.token_logic.balanceOf(other_user);
                expect(token_balance).to.be.bignumber.equal(owner_token_balance.add(value));

                token_balance = await this.token_logic.balanceOf(digital_investor);
                expect(token_balance).to.be.bignumber.equal(buyer_token_balance.sub(_price));

                token_balance = await this.token_logic.balanceOf(minter_address); //company address
                expect(token_balance).to.be.bignumber.equal(company_token_balance.add(fee_to_keep));
            });
            it(type + ' reverting on reentering Completed transaction', async () => {
                await expectRevert(this.nft_c_logic.implementTransaction(tx_id.toString(), {from: digital_investor})
                    , "Transaction is not active.");
            });
            it(type + ' reverting on fake transaction id', async () => {
                await expectRevert(this.nft_c_logic.implementTransaction("42", {from: digital_investor})
                    , "Transaction is not active");
            });
            it(type + ' ownership confirmation for both Users', async () => {
                let owners = await this.nft_o_logic.getOwnershipForNFT(nft_id, {from: other_user});
                assert.equal(owners.length, 2);
                assert.equal(owners[0].toString(), other_user);
                assert.equal(owners[1].toString(), digital_investor);
            });
            it(type + ' shares confirmation for both Users, transaction Completed', async () => {
                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(shares_left.toString());
                expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(shares_left.toString());
                expect(await this.nft_o_logic.getSharesBlocked(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(ZERO_SHARES);

                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: digital_investor})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(shares_to_sell.toString());
                expect(await this.nft_o_logic.getSharesAvailable(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(shares_to_sell.toString());
                expect(await this.nft_o_logic.getSharesBlocked(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
            });
            it(type + ' reverting on too many shares requested', async () => {
                let _shares_left = (SHARES_TOTAL - shares_to_sell) + 1;
                await expectRevert(this.nft_c_logic.approveTransaction(
                    other_user,
                    digital_investor,
                    nft_id,
                    _shares_left.toString(),
                    price2nd.toString(),
                    is_ether_payment,
                    {from: other_user}
                ), "not enough shares");
            });
            it(type + ' approving transaction to transfer what\'s left in shares', async () => {
                ++tx_id;

                let txResult = await this.nft_c_logic.approveTransaction(
                    other_user,
                    digital_investor,
                    nft_id,
                    shares_left.toString(),
                    price2nd.toString(),
                    is_ether_payment,
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'TransactionApproved', {
                    from: other_user,
                    to: digital_investor,
                    nft_id: nft_id,
                    shares: shares_left.toString(),
                    price: price2nd.toString(),
                    tx_id: tx_id.toString(), //separate counter, TX is not an NFT
                    payment: "ether"
                });
            });
            it(type + ' shares confirmation for both Users, transaction Approved', async () => {
                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(shares_left.toString());
                expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(ZERO_SHARES);
                expect(await this.nft_o_logic.getSharesBlocked(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(shares_left.toString());

                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: digital_investor})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(shares_to_sell.toString());
                expect(await this.nft_o_logic.getSharesAvailable(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(shares_to_sell.toString());
                expect(await this.nft_o_logic.getSharesBlocked(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
            });
            it(type + ' reverting on zero value for transaction in Eth', async () => {
                await expectRevert(
                    this.nft_c_logic.implementTransaction(
                        tx_id.toString(),
                        {from: digital_investor, value: "0"}),
                    " price mismatch");
            });
            it(type + ' recording balances before transaction', async () => {
                owner_ether_balance = await web3.eth.getBalance(other_user);
                buyer_ether_balance = await web3.eth.getBalance(digital_investor);
                company_ether_balance = await web3.eth.getBalance(minter_address);
            });
            it(type + ' implementing Transaction in Eth', async () => {
                let project_id = "0";
                let collection_id = "0";
                try {
                    project_id = await this.nft_c_logic.getProjectOfToken(nft_id, {from: other_user});
                } catch (e) {
                }
                try {
                    collection_id = await this.nft_c_logic.getCollectionOfToken(nft_id, {from: other_user});
                } catch (e) {
                }

                let txResult = await this.nft_c_logic.implementTransaction(tx_id.toString(), {
                    from: digital_investor,
                    value: price2nd
                });
                const {logs} = txResult;

                // console.log(buyer_ether_balance);
                // console.log(txResult.receipt.gasUsed);
                buyer_ether_balance = buyer_ether_balance - txResult.receipt.gasUsed;
                // console.log(buyer_ether_balance);
                // console.log(txResult);
                // console.log(logs);

                expectEvent.inLogs(logs, 'NFTTransferred', {
                    from: other_user,
                    to: digital_investor,
                    project_id: project_id,
                    collection_id: collection_id,
                    nft_id: nft_id,
                    nft_type: type,
                });
                expectEvent.inLogs(logs, 'TransactionImplemented', {
                    from: other_user,
                    to: digital_investor,
                    nft_id: nft_id,
                    shares: shares_left.toString(),
                    price: price2nd.toString(),
                    tx_id: tx_id.toString()
                });
            });
            it(type + ' check and record balances after Eth transaction', async () => {
                const _owner_ether_balance = new BN(owner_ether_balance.toString());
                const _buyer_ether_balance = new BN(buyer_ether_balance.toString());
                const _company_ether_balance = new BN(company_ether_balance.toString());

                const _price2nd = new BN(price2nd.toString());
                const _fee_to_keep = await this.nft_t_logic.getTransactionFeeTX(tx_id, {from: other_user});
                const _value = _price2nd.sub(_fee_to_keep);

                let ether_balance = await web3.eth.getBalance(other_user);
                ether_balance = new BN(ether_balance.toString());
                expect(ether_balance).to.be.bignumber.equal(_owner_ether_balance.add(_value));

                ether_balance = await web3.eth.getBalance(minter_address); //company address
                ether_balance = new BN(ether_balance.toString());
                expect(ether_balance).to.be.bignumber.equal(_company_ether_balance.add(_fee_to_keep));

                ether_balance = await web3.eth.getBalance(digital_investor);
                ether_balance = new BN(ether_balance.toString());
                //lte because of gas used to call a transaction
                expect(ether_balance).to.be.bignumber.lte(_buyer_ether_balance.sub(_price2nd));
            });
            it(type + ' shares confirmation for both Users, transaction Completed', async () => {
                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: other_user})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(ZERO_SHARES);
                expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(ZERO_SHARES);
                expect(await this.nft_o_logic.getSharesBlocked(other_user, nft_id, {from: other_user})).to.be.bignumber.equal(ZERO_SHARES);

                expect(await this.nft_o_logic.getTotalSharesForNFT(nft_id, {from: digital_investor})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesTotal(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesAvailable(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(SHARES_TOTAL.toString());
                expect(await this.nft_o_logic.getSharesBlocked(digital_investor, nft_id, {from: digital_investor})).to.be.bignumber.equal(ZERO_SHARES);
            });
            it(type + ' ownership confirmation for both Users', async () => {
                let owners = await this.nft_o_logic.getOwnershipForNFT(nft_id, {from: other_user});
                assert.equal(owners.length, 1);
                assert.equal(owners[0].toString(), digital_investor);
            });
        }
        it('post-test ownership confirmation for User 1', async () => {
            await expectRevert(this.nft_o_logic.getOwnershipForAddress(other_user, {from: other_user})
                , "no NFTs owned");
        });
        it('post-test ownership confirmation for User 2', async () => {
            let nft_ids = await this.nft_o_logic.getOwnershipForAddress(digital_investor, {from: digital_investor});
            assert.equal(nft_ids.length, 7);
            let ids = [5, 6, 7, 2, 3, 4, 1];
            for (let i = 0; i !== ids.length; ++i) {
                assert.equal(nft_ids[i].toString(), ids[i].toString());
            }
        });

        it.skip('transferring for Governance', async () => {
            expect(true).to.be.false;
        });
        it.skip('operatorship test', async () => {
            expect(true).to.be.false;
        });
    });
    context('nft info, viewers and checkers', function () {
        const SHARES_TOTAL = 100;
        const ZERO_SHARES = "0";
        const INITIAL_TOKEN_BALANCE = "200";

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

            await this.token_logic.registerAddress(other_user, {from: minter_address});
            await this.token_logic.registerAddress(digital_investor, {from: minter_address});

            let updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
            updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});
        });

        it('checking Project status', async () => {
            expect(await this.nft_c_logic.isNoNft("1", {from: other_user})).to.be.true;
            expect(await this.nft_c_logic.isOkNft("1", {from: other_user})).to.be.false;
            await this.pc_logic.createProject(other_user, "Test project", "Production", "Stream", SHARES_TOTAL.toString(), {from: other_user});
            expect(await this.nft_c_logic.isNoNft("1", {from: other_user})).to.be.false;
            expect(await this.nft_c_logic.isOkNft("1", {from: other_user})).to.be.true;
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});
        });
        it('checking Stake status', async () => {
            expect(await this.nft_c_logic.isNoNft("2", {from: other_user})).to.be.true;
            expect(await this.nft_c_logic.isOkNft("2", {from: other_user})).to.be.false;
            await this.sm_logic.stake(other_user, "900", "1", SHARES_TOTAL.toString(), {from: other_user});
            expect(await this.nft_c_logic.isNoNft("2", {from: other_user})).to.be.false;
            expect(await this.nft_c_logic.isOkNft("2", {from: other_user})).to.be.true;
        });
        it('checking Debt status', async () => {
            expect(await this.nft_c_logic.isNoNft("3", {from: other_user})).to.be.true;
            expect(await this.nft_c_logic.isOkNft("3", {from: other_user})).to.be.false;
            await this.dm_logic.registerDebt(other_user, "1", "100", "10", SHARES_TOTAL.toString(), {from: minter_address});
            expect(await this.nft_c_logic.isNoNft("3", {from: other_user})).to.be.false;
            expect(await this.nft_c_logic.isOkNft("3", {from: other_user})).to.be.true;
        });
        it('checking Collection status', async () => {
            expect(await this.nft_c_logic.isNoNft("4", {from: other_user})).to.be.true;
            expect(await this.nft_c_logic.isOkNft("4", {from: other_user})).to.be.false;
            await this.nft_c_logic.mint(other_user, "Collection", "www.google.com", "0", "1", "0", SHARES_TOTAL.toString(), {from: other_user});
            expect(await this.nft_c_logic.isNoNft("4", {from: other_user})).to.be.false;
            expect(await this.nft_c_logic.isOkNft("4", {from: other_user})).to.be.true;
        });
        it('checking ProjectArt status', async () => {
            expect(await this.nft_c_logic.isNoNft("5", {from: other_user})).to.be.true;
            expect(await this.nft_c_logic.isOkNft("5", {from: other_user})).to.be.false;
            await this.nft_c_logic.mint(other_user, "ProjectArt", "www.google.com", "0", "0", "0", SHARES_TOTAL.toString(), {from: other_user});
            expect(await this.nft_c_logic.isNoNft("5", {from: other_user})).to.be.false;
            expect(await this.nft_c_logic.isOkNft("5", {from: other_user})).to.be.true;
        });
        it('checking Ticket status', async () => {
            expect(await this.nft_c_logic.isNoNft("6", {from: other_user})).to.be.true;
            expect(await this.nft_c_logic.isOkNft("6", {from: other_user})).to.be.false;
            await this.nft_c_logic.mint(other_user, "Ticket", "www.google.com", "0", "1", "0", SHARES_TOTAL.toString(), {from: other_user});
            expect(await this.nft_c_logic.isNoNft("6", {from: other_user})).to.be.false;
            expect(await this.nft_c_logic.isOkNft("6", {from: other_user})).to.be.true;
        });
        it('checking Other status', async () => {
            expect(await this.nft_c_logic.isNoNft("7", {from: other_user})).to.be.true;
            expect(await this.nft_c_logic.isOkNft("7", {from: other_user})).to.be.false;
            await this.nft_c_logic.mint(other_user, "Other", "www.google.com", "4", "0",  "0", SHARES_TOTAL.toString(), {from: other_user});
            expect(await this.nft_c_logic.isNoNft("7", {from: other_user})).to.be.false;
            expect(await this.nft_c_logic.isOkNft("7", {from: other_user})).to.be.true;
        });
        it('info general', async () => {
            const info = await this.nft_c_logic.getNftTypes({from: other_user});
            assert.equal(info.length, 7);
            assert.equal(info[0], "Project");
            assert.equal(info[1], "Stake");
            assert.equal(info[2], "Debt");
            assert.equal(info[3], "Collection");
            assert.equal(info[4], "ProjectArt");
            assert.equal(info[5], "Ticket");
            assert.equal(info[6], "Other");
        });
        it('info on a Project', async () => {
            const info = await this.nft_c_logic.nftToJson("1", {from: other_user});
            let json = JSON.parse(info);
            assert.equal(json.type, "Project");
            assert.equal(json.nft_id, "1");
            assert.equal(json.NFTs.length, 4);

            await expectRevert(this.nft_c_logic.getProjectOfToken("1", {from: other_user})
            , "No project linked");
            await expectRevert(this.nft_c_logic.getCollectionOfToken("1", {from: other_user})
                , "No collection linked");
            const nft = await this.nft_c_logic.getNFT("1", {from: other_user});
            assert.equal(nft._type, "0");
        });
        it('info on a Stake', async () => {
            const info = await this.nft_c_logic.nftToJson("2", {from: other_user});
            let json = JSON.parse(info);
            assert.equal(json.type, "Stake");
            assert.equal(json.nft_id, "2");
            const project_id = await this.nft_c_logic.getProjectOfToken("2", {from: other_user});
            assert.equal(project_id, "1");
            await expectRevert(this.nft_c_logic.getCollectionOfToken("2", {from: other_user})
                , "No collection linked");
            const nft = await this.nft_c_logic.getNFT("2", {from: other_user});
            assert.equal(nft._type, "1");
        });
        it('info on a Debt', async () => {
            const info = await this.nft_c_logic.nftToJson("3", {from: other_user});
            let json = JSON.parse(info);
            assert.equal(json.type, "Debt");
            assert.equal(json.nft_id, "3");

            const project_id = await this.nft_c_logic.getProjectOfToken("3", {from: other_user});
            assert.equal(project_id, "1");
            await expectRevert(this.nft_c_logic.getCollectionOfToken("3", {from: other_user})
                , "No collection linked");
            const nft = await this.nft_c_logic.getNFT("3", {from: other_user});
            assert.equal(nft._type, "2");
        });
        it('info on a Collection', async () => {
            const info = await this.nft_c_logic.nftToJson("4", {from: other_user});
            let json = JSON.parse(info);
            assert.equal(json.type, "Collection");
            assert.equal(json.nft_id, "4");

            const project_id = await this.nft_c_logic.getProjectOfToken("4", {from: other_user});
            assert.equal(project_id, "1");
            await expectRevert(this.nft_c_logic.getCollectionOfToken("4", {from: other_user})
                , "No collection linked");
            const nft = await this.nft_c_logic.getNFT("4", {from: other_user});
            assert.equal(nft._type, "3");
        });
        it('info on a ProjectArt', async () => {
            const info = await this.nft_c_logic.nftToJson("5", {from: other_user});
            let json = JSON.parse(info);
            assert.equal(json.type, "ProjectArt");
            assert.equal(json.nft_id, "5");

            await expectRevert(this.nft_c_logic.getProjectOfToken("5", {from: other_user})
                , "No project linked");
            await expectRevert(this.nft_c_logic.getCollectionOfToken("5", {from: other_user})
                , "No collection linked");
            const nft = await this.nft_c_logic.getNFT("5", {from: other_user});
            assert.equal(nft._type, "4");
        });
        it('info on a Ticket', async () => {
            const info = await this.nft_c_logic.nftToJson("6", {from: other_user});
            let json = JSON.parse(info);
            assert.equal(json.type, "Ticket");
            assert.equal(json.nft_id, "6");

            const project_id = await this.nft_c_logic.getProjectOfToken("6", {from: other_user});
            assert.equal(project_id, "1");
            await expectRevert(this.nft_c_logic.getCollectionOfToken("6", {from: other_user})
                , "No collection linked");
            const nft = await this.nft_c_logic.getNFT("6", {from: other_user});
            assert.equal(nft._type, "5");
        });
        it('info on a Other', async () => {
            const info = await this.nft_c_logic.nftToJson("7", {from: other_user});
            let json = JSON.parse(info);
            assert.equal(json.type, "Other");
            assert.equal(json.nft_id, "7");

            await expectRevert(this.nft_c_logic.getProjectOfToken("7", {from: other_user})
                , "No project linked");
            const collection_id = await this.nft_c_logic.getCollectionOfToken("7", {from: other_user});
            assert.equal(collection_id, "4");
            const nft = await this.nft_c_logic.getNFT("7", {from: other_user});
            assert.equal(nft._type, "6");
        });
    });
    context('nft burn', function () {

        const SHARES_TOTAL = 100;
        const ZERO_SHARES = "0";
        const PRICE = 100;
        const INITIAL_TOKEN_BALANCE = "200";

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

            await this.token_logic.registerAddress(other_user, {from: minter_address});
            await this.token_logic.registerAddress(digital_investor, {from: minter_address});

            let updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
            updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});
        });

        let types = ["Project", "Debt", "Stake", "Collection", "ProjectArt", "Ticket", "Other"];
        for (let idx = 0; idx != types.length; ++idx){
            let type = types[idx];
            it(type + ' checking absent status', async () => {
                expect(await this.nft_c_logic.isNoNft((idx+1).toString(), {from: other_user})).to.be.true;
            });
        }

        it('creating Projects, Debts, Stakes and Revenues instances', async () => {
            //1
            await this.pc_logic.createProject(other_user, "Test project 1", "Production", "Stream", SHARES_TOTAL.toString(), {from: other_user});
            const PROJECT_ID = "1";
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});
            //2
            await this.dm_logic.registerDebt(other_user, PROJECT_ID, "100000", "388", SHARES_TOTAL.toString(), {from: minter_address});
            

            const STAKE = 300;
            //3
            await this.sm_logic.stake(other_user, STAKE.toString(), PROJECT_ID, SHARES_TOTAL.toString(), {from: other_user});
            await this.rm_logic.registerRevenue(PROJECT_ID, "1000", {from: minter_address});
            //4
            await this.nft_c_logic.mint(other_user, "Collection", "www.google.com", "0", PROJECT_ID, SHARES_TOTAL.toString(), PRICE.toString(), {from: other_user});
            const COLLECTION_ID = "4";
            //5
            await this.nft_c_logic.mint(other_user, "ProjectArt", "www.google.com", COLLECTION_ID, PROJECT_ID, PRICE.toString(), SHARES_TOTAL.toString(), {from: other_user});
            let nft_id = "5";
            const shares_to_sell = 50;
            const price = 500;
            const is_ether_payment = true;
            let tx_id = 1;
            await this.nft_c_logic.approveTransaction(other_user, digital_investor, nft_id, shares_to_sell.toString(), price.toString(), !is_ether_payment, {from: other_user});
            await this.nft_c_logic.implementTransaction(tx_id.toString(), {from: digital_investor});

            //6
            await this.nft_c_logic.mint(other_user, "Ticket", "www.google.com", COLLECTION_ID, PROJECT_ID, PRICE.toString(), SHARES_TOTAL.toString(), {from: other_user});
            //7
            await this.nft_c_logic.mint(other_user, "Other", "www.google.com", COLLECTION_ID, PROJECT_ID, PRICE.toString(), SHARES_TOTAL.toString(), {from: other_user});
            nft_id = "7";
            ++tx_id;
            await this.nft_c_logic.approveTransaction(other_user, digital_investor, nft_id, shares_to_sell.toString(), price.toString(), !is_ether_payment, {from: other_user});
            await this.nft_c_logic.implementTransaction(tx_id.toString(), {from: digital_investor});
        });
        for (let idx = 0; idx !== types.length; ++idx){
            let type = types[idx];
            it(type + ' checking Ok status', async () => {
                expect(await this.nft_c_logic.isOkNft((idx+1).toString(), {from: other_user})).to.be.true;
            });
        }
        it('reverting on attempt to burn non-existent NFT', async () => {
            await expectRevert(this.nft_c_logic.burn(other_user, "42", {from: other_user})
                , "no NFT");
        });
        it('reverting on attempt to burn Project', async () => {
            await expectRevert(this.nft_c_logic.burn(other_user, "1", {from: other_user})
                , "use Project Catalog");
        });
        it('reverting on attempt to burn Debt', async () => {
            await expectRevert(this.nft_c_logic.burn(other_user, "2", {from: other_user})
                , "use Debt Manager");
        });
        it('reverting on attempt to burn Stake', async () => {
            await expectRevert(this.nft_c_logic.burn(other_user, "3", {from: other_user})
                , "use Stakes Manager");
        });
        it('successfully paying out Finance NFTs', async () => {
            let block = await web3.eth.getBlock('latest');
            let now = block.timestamp+10;
            let total = await this.rm_logic.getProjectRevenuesToDistribute("1", {from: other_user});
            await this.rm_logic.payoutRevenue("1", now.toString(), {from: minter_address, value: total});
            await this.dm_logic.payoutProjectDebt("1", {from: minter_address});
            await this.sm_logic.withdrawStake(other_user, "3", {from: other_user});
        });

        types = ["Collection", "ProjectArt", "Ticket", "Other"];
        let nft_ids = ["4", "5", "6", "7"];
        for (let idx = 0; idx !== types.length; ++idx) {
            let type = types[idx];
            let nft_id = nft_ids[idx];

            it(type + ' checking Project ID before deleting a project', async () => {
                let project_id = await this.nft_c_logic.getProjectOfToken(nft_id);
                expect(project_id).to.be.bignumber.equal("1");
            });
        }
        it('successfully deleting a Project', async () => {
            await this.pc_logic.closeProjectBudget(other_user, "1", {from: other_user});
            await this.pc_logic.deleteProject(other_user, "1", {from: other_user});
        });
        for (let idx = 0; idx !== types.length; ++idx) {
            let type = types[idx];
            let nft_id = nft_ids[idx];

            it(type + ' checking Project ID after deleting a project', async () => {
                await expectRevert(this.nft_c_logic.getProjectOfToken(nft_id)
                    , "No project linked");
            });
        }

        types = ["ProjectArt", "Ticket", "Other"];
        nft_ids = ["5", "6", "7"];
        for (let idx = 0; idx !== types.length; ++idx) {
            let type = types[idx];
            let nft_id = nft_ids[idx];

            it(type + ' checking Collection ID before deleting a collection', async () => {
                let collection_id = await this.nft_c_logic.getCollectionOfToken(nft_id);
                expect(collection_id).to.be.bignumber.equal("4");
            });
        }
        it('reverting on unauthorized attempt of burning Collection', async () => {
            await expectRevert(this.nft_c_logic.burn(
                    deployer_address,
                    "4",
                    {from: deployer_address})
                , "owner doesn't have this NFT");
        });

        it('successfully burning a Collection', async () => {
            let txResult = await this.nft_c_logic.burn(
                other_user,
                "4",
                {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTBurned', {
                by: other_user,
                project_id: "0",
                collection_id : "0",
                nft_id: "4",
                nft_type: "Collection"
            });
        });
        for (let idx = 0; idx !== types.length; ++idx) {
            let type = types[idx];
            let nft_id = nft_ids[idx];
            it(type + ' checking Collection ID after burning a collection', async () => {
                await expectRevert(this.nft_c_logic.getCollectionOfToken(nft_id)
                , "No collection linked");
            });
        }


        it('reverting on unauthorized attempt of burning a Ticket (NFT with single ownership)', async () => {
            await expectRevert(this.nft_c_logic.burn(
                    deployer_address,
                    "6",
                    {from: deployer_address})
                , "owner doesn't have this NFT");
        });
        it('successfully burning a Ticket', async () => {
            let txResult = await this.nft_c_logic.burn(
                other_user,
                "6",
                {from: other_user});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NFTBurned', {
                by: other_user,
                project_id: "0",
                collection_id: "0",
                nft_id: "6",
                nft_type: "Ticket"
            });
        });



        types = ["ProjectArt", "Other"];
        nft_ids = ["5", "7"];
        for (let idx = 0; idx !== types.length; ++idx) {
            let type = types[idx];
            let nft_id = nft_ids[idx];
            it(type + ' reverting on unauthorized attempt of burning', async () => {
                await expectRevert(this.nft_c_logic.burn(
                        deployer_address,
                        nft_id,
                        {from: deployer_address})
                    , "owner doesn't have this NFT");
            });
            it(type + ' successfully burning a first part', async () => {
                await this.nft_c_logic.burn(other_user, nft_id, {from: other_user});
            });
            it(type + ' checking Ok status', async () => {
                expect(await this.nft_c_logic.isOkNft(nft_id, {from: other_user})).to.be.true;
            });
            it(type + ' successfully burning a final part', async () => {
                let txResult = await this.nft_c_logic.burn(
                    digital_investor,
                    nft_id,
                    {from: digital_investor});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'NFTBurned', {
                    by: digital_investor,
                    project_id: "0",
                    collection_id: "0",
                    nft_id: nft_id,
                    nft_type: type
                });
            });
            it(type + ' checking Burned status', async () => {
                expect(await this.nft_c_logic.isNftBurned(nft_id, {from: other_user})).to.be.true;
            });
        }

        types = ["Project", "Debt", "Stake", "Collection", "ProjectArt", "Ticket", "Other"];
        for (let idx = 0; idx != types.length; ++idx){
            let type = types[idx];
            it(type + ' checking Burned status', async () => {
                expect(await this.nft_c_logic.isNftBurned((idx+1).toString(), {from: other_user})).to.be.true;
            });
        }
    });
});
