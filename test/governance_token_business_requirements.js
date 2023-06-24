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


contract('Governance Token - BRD', ([registryFunder, deployer_address, other_user, admin_address, minter_address, digital_investor]) => {

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
    const TOKENS_TO_VOTING_POWER = 1;
    const MONETARY_VALUE = 500;


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
            await this.dm_logic.initialize("1", 1, {from:minter_address});

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
            await this.rm_logic.initialize("1", 1, {from:minter_address});

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
            await this.sm_logic.initialize("1", 1, {from:minter_address});

            this.nft_c_impl = await NFTCatalogImplementation.new({from:deployer_address});
            this.nft_c_proxy = await NFTCatalogProxy.new(
                nft_c_name, nft_c_symbol,
                this.nft_c_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                {from:deployer_address});
            this.nft_c_logic = await NFTCatalogImplementation.at(this.nft_c_proxy.address);
            await this.nft_c_logic.initialize("1", 1, {from:minter_address});

            this.nft_o_impl = await NFTOwnershipImplementation.new({from:deployer_address});
            this.nft_o_proxy = await NFTOwnershipProxy.new(
                nft_o_name, nft_o_symbol,
                this.nft_o_impl.address,
                admin_address,
                minter_address,
                {from:deployer_address});
            this.nft_o_logic = await NFTOwnershipImplementation.at(this.nft_o_proxy.address);
            await this.nft_o_logic.initialize("1", 1, {from:minter_address});

            this.nft_t_impl = await NFT_TransactionPool_Implementation.new({from:deployer_address});
            this.nft_t_proxy = await NFT_TransactionPoolProxy.new(
                nft_t_name, nft_t_symbol,
                this.nft_t_impl.address,
                admin_address,
                minter_address,
                {from:deployer_address});
            this.nft_t_logic = await NFT_TransactionPool_Implementation.at(this.nft_t_proxy.address);
            await this.nft_t_logic.initialize("1", 1, {from:minter_address});

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
            await this.pc_logic.initialize("1", 1, {from:minter_address});

            this.gt_impl = await GovernanceTokenImplementation.new({from:deployer_address});
            this.gt_proxy = await GovernanceTokenProxy.new(
                gt_name, gt_symbol,
                this.gt_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                {from:deployer_address});
            this.gt_logic = await GovernanceTokenImplementation.at(this.gt_proxy.address);
            await this.gt_logic.initialize("1", 1, {from:minter_address});


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
                "1", 1,
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
            await this.nft_c_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.nft_c_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});

            await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.nft_o_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.nft_o_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            await this.nft_o_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            await this.nft_o_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});

            await this.dm_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.dm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.dm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.dm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.rm_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.rm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.rm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.rm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.rm_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            await this.sm_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.sm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.sm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.sm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.pc_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.pc_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.pc_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.pc_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            await this.pc_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            // await this.gt_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            // await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            // await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            // await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});


            await this.pc_logic.createProject(other_user, "Test project", "Production", "Script", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});

            await this.token_logic.setAddressRegistered(other_user,  true,{from: minter_address});
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
        it('GovernanceToken reverting on unauthorised setting up NativeToken', async () => {
            await expectRevert.unspecified(
                this.gt_logic.setNativeToken(this.token_logic.address, {from:deployer_address}));
        });
        it('GovernanceToken setting up NativeToken', async () => {
            let txResult = await this.gt_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'NativeTokenSet', {
                token: this.token_logic.address,
            });
        });
        it('GovernanceToken reverting on unauthorised setting up DebtManager', async () => {
            await expectRevert.unspecified(
                this.gt_logic.setDebtManager(this.dm_logic.address, {from:deployer_address}));
        });
        it('GovernanceToken setting up DebtManager', async () => {
            let txResult = await this.gt_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'DebtManagerSet', {
                debt_manager: this.dm_logic.address,
            });
        });
        it('GovernanceToken reverting on unauthorised setting up StakesManager', async () => {
            await expectRevert.unspecified(
                this.gt_logic.setStakesManager(this.sm_logic.address, {from:deployer_address}));
        });
        it('GovernanceToken setting up StakesManager', async () => {
            let txResult = await this.gt_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            const {logs} = txResult;
            expectEvent.inLogs(logs, 'StakesManagerSet', {
                stakes_manager: this.sm_logic.address,
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

    context('depositing', function () {
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
            await this.dm_logic.initialize("1", 1, {from:minter_address});

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
            await this.rm_logic.initialize("1", 1, {from:minter_address});

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
            await this.sm_logic.initialize("1", 1, {from:minter_address});

            this.nft_c_impl = await NFTCatalogImplementation.new({from:deployer_address});
            this.nft_c_proxy = await NFTCatalogProxy.new(
                nft_c_name, nft_c_symbol,
                this.nft_c_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                {from:deployer_address});
            this.nft_c_logic = await NFTCatalogImplementation.at(this.nft_c_proxy.address);
            await this.nft_c_logic.initialize("1", 1, {from:minter_address});

            this.nft_o_impl = await NFTOwnershipImplementation.new({from:deployer_address});
            this.nft_o_proxy = await NFTOwnershipProxy.new(
                nft_o_name, nft_o_symbol,
                this.nft_o_impl.address,
                admin_address,
                minter_address,
                {from:deployer_address});
            this.nft_o_logic = await NFTOwnershipImplementation.at(this.nft_o_proxy.address);
            await this.nft_o_logic.initialize("1", 1, {from:minter_address});

            this.nft_t_impl = await NFT_TransactionPool_Implementation.new({from:deployer_address});
            this.nft_t_proxy = await NFT_TransactionPoolProxy.new(
                nft_t_name, nft_t_symbol,
                this.nft_t_impl.address,
                admin_address,
                minter_address,
                {from:deployer_address});
            this.nft_t_logic = await NFT_TransactionPool_Implementation.at(this.nft_t_proxy.address);
            await this.nft_t_logic.initialize("1", 1, {from:minter_address});

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
            await this.pc_logic.initialize("1", 1, {from:minter_address});

            this.gt_impl = await GovernanceTokenImplementation.new({from:deployer_address});
            this.gt_proxy = await GovernanceTokenProxy.new(
                gt_name, gt_symbol,
                this.gt_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                {from:deployer_address});
            this.gt_logic = await GovernanceTokenImplementation.at(this.gt_proxy.address);
            await this.gt_logic.initialize("1", 1, {from:minter_address});


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
                "1", 1,
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
            await this.nft_c_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.nft_c_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});

            await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.nft_o_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.nft_o_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            await this.nft_o_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            await this.nft_o_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});

            await this.dm_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.dm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.dm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.dm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.rm_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.rm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.rm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.rm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.rm_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            await this.sm_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.sm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.sm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.sm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.pc_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.pc_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.pc_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.pc_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            await this.pc_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            await this.gt_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.gt_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.gt_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            await this.token_logic.setAddressRegistered(other_user, true, {from: minter_address});
            await this.token_logic.setAddressRegistered(digital_investor, true, {from: minter_address});
            await this.token_logic.setAddressRegistered(deployer_address, true, {from: minter_address});

            let updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
            await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});
            await this.token_logic.fromEtherToTokens(deployer_address, {from: deployer_address, value: updated_amount});

        });

        it('creating required instances', async () => {
            //1
            await this.pc_logic.createProject(other_user, "Test project", "Production", "Script", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});
            //2
            await this.pc_logic.createProject(deployer_address, "Test project", "Production", "Script", SHARES_TOTAL.toString(), {from: deployer_address});
            await this.pc_logic.registerProjectBudget(deployer_address, "2", "2000", "1000", {from: deployer_address});

            //3
            await this.dm_logic.registerDebt(other_user, "1", MONETARY_VALUE.toString(), "136", SHARES_TOTAL.toString(), {from: minter_address});
            //4
            await this.sm_logic.stake(other_user, MONETARY_VALUE.toString(), "1", SHARES_TOTAL.toString(), {from: other_user});
            //5
            await this.dm_logic.registerDebt(other_user, "2", MONETARY_VALUE.toString(), "136", SHARES_TOTAL.toString(), {from: minter_address});
            //6
            await this.sm_logic.stake(other_user, MONETARY_VALUE.toString(), "2", SHARES_TOTAL.toString(), {from: other_user});
            //7
            await this.nft_c_logic.mint(other_user, "Collection", "www.google.com", "0", "1", SHARES_TOTAL.toString(), {from: other_user});
            //8
            await this.nft_c_logic.mint(other_user, "ProjectArt", "www.google.com", "0", "1", SHARES_TOTAL.toString(), {from: other_user});
            //9
            await this.nft_c_logic.mint(other_user, "Ticket", "www.google.com", "0", "1", SHARES_TOTAL.toString(), {from: other_user});
            //10
            await this.nft_c_logic.mint(other_user, "Other", "www.google.com", "0", "1", SHARES_TOTAL.toString(), {from: other_user});


            const nft_ids = ["3", "4", "5", "6", "7", "8", "9", "10"];
            const is_ether_payment = true;
            let tx_id = await (1);
            for (let idx = 0; idx !== nft_ids.length; ++idx) {
                await this.nft_c_logic.approveTransaction(
                    other_user,
                    deployer_address,
                    nft_ids[idx],
                    (SHARES_TOTAL / 2).toString(),
                    (PRICE / 2).toString(), //price
                    is_ether_payment,
                    {from: other_user});
                await this.nft_c_logic.implementTransaction(tx_id.toString(), {from: deployer_address, value: (PRICE / 2).toString()});
                ++tx_id;
            }
        });

        let other_user_balance;
        let digital_investor_balance;
        let deployer_address_balance;
        let company_account_balance;

        let other_user_vpower;
        let digital_investor_vpower;
        let deployer_address_vpower;
        let company_account_vpower;

        const PROJECT_IDS = ["0", "1"];
        const PROJECT_NAMES = ["system-wide decision", "project-related decision"];
        const NFT_IDS_OK = ["3", "4"];
        const NFT_IDS_WRONG_PROJECT = ["5", "6"];
        const NFT_IDS_NOT_OK = ["7", "8", "9", "10"];
        const NFT_ID_TYPES = ["Collection", "ProjectArt", "Ticket", "Other"];

        for (let idx = 0; idx !== PROJECT_IDS.length; ++idx) {
            let project_id = PROJECT_IDS[idx];
            let project_name = PROJECT_NAMES[idx];

            it('recording voting power before depositing Tokens for ' + project_name, async () => {
                other_user_vpower = await this.gt_logic.getVotes(other_user, project_id);
                digital_investor_vpower = await this.gt_logic.getVotes(digital_investor, project_id);
                deployer_address_vpower = await this.gt_logic.getVotes(deployer_address, project_id);
                company_account_vpower = await this.gt_logic.getVotes(minter_address, project_id);
            });
            it('recording balances before depositing Tokens for ' + project_name, async () => {
                other_user_balance = await this.token_logic.balanceOf(other_user);
                digital_investor_balance = await this.token_logic.balanceOf(digital_investor);
                deployer_address_balance = await this.token_logic.balanceOf(deployer_address);
                company_account_balance = await this.token_logic.balanceOf(minter_address); //company address
            });
            it('depositing Tokens for ' + project_name + ' from User 1', async () => {
                const txResult = await this.gt_logic.depositTokens(
                    other_user,
                    TOKENS_TO_VOTING_POWER.toString(),
                    project_id,
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'TokensDeposited', {
                    by: other_user,
                    project_id: project_id,
                    volume: TOKENS_TO_VOTING_POWER.toString()
                });
            });
            it('depositing Tokens for ' + project_name + ' from User 2', async () => {
                const txResult = await this.gt_logic.depositTokens(
                    digital_investor,
                    (TOKENS_TO_VOTING_POWER * 2).toString(),
                    project_id,
                    {from: digital_investor});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'TokensDeposited', {
                    by: digital_investor,
                    project_id: project_id,
                    volume: (TOKENS_TO_VOTING_POWER * 2).toString()
                });
            });
            it('checking balances after depositing Tokens for ' + project_name, async () => {
                let token_balance = await this.token_logic.balanceOf(other_user);
                let _tokens_to_voting_power = new BN(TOKENS_TO_VOTING_POWER.toString());
                expect(token_balance).to.be.bignumber.equal(other_user_balance.sub(_tokens_to_voting_power));

                token_balance = await this.token_logic.balanceOf(digital_investor);
                expect(token_balance).to.be.bignumber.equal(digital_investor_balance.sub(new BN((TOKENS_TO_VOTING_POWER * 2).toString())));

                token_balance = await this.token_logic.balanceOf(deployer_address);
                expect(token_balance).to.be.bignumber.equal(deployer_address_balance);

                token_balance = await this.token_logic.balanceOf(minter_address); //company address
                expect(token_balance).to.be.bignumber.equal(company_account_balance.add(new BN((TOKENS_TO_VOTING_POWER * 3).toString())));
            });
            it('checking voting power after depositing Tokens for ' + project_name, async () => {
                let voting_power = await this.gt_logic.getVotes(other_user, project_id);
                expect(voting_power).to.be.bignumber.equal(other_user_vpower.add(new BN(TOKENS_TO_VOTING_POWER.toString())));

                voting_power = await this.gt_logic.getVotes(digital_investor, project_id);
                expect(voting_power).to.be.bignumber.equal(digital_investor_vpower.add(new BN((TOKENS_TO_VOTING_POWER * 2).toString())));

                voting_power = await this.gt_logic.getVotes(deployer_address, project_id);
                expect(voting_power).to.be.bignumber.equal(deployer_address_vpower);

                voting_power = await this.gt_logic.getVotes(minter_address, project_id);
                expect(voting_power).to.be.bignumber.equal(company_account_vpower);
            });

            for (let _idx = 0; _idx !== NFT_IDS_OK.length; ++_idx) {
                let nft_id = NFT_IDS_OK[_idx];
                it('checking NFT\'s ownership before depositing for ' + project_name, async () => {
                    expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user})).to.be.bignumber.equal((SHARES_TOTAL / 2).toString());
                    expect(await this.nft_o_logic.getSharesAvailable(deployer_address, nft_id, {from: deployer_address})).to.be.bignumber.equal((SHARES_TOTAL/2).toString());
                });
                it('recording voting power before depositing NFT for ' + project_name, async () => {
                    other_user_vpower = await this.gt_logic.getVotes(other_user, project_id);
                    digital_investor_vpower = await this.gt_logic.getVotes(digital_investor, project_id);
                    deployer_address_vpower = await this.gt_logic.getVotes(deployer_address, project_id);
                    company_account_vpower = await this.gt_logic.getVotes(minter_address, project_id);
                });
                it('depositing NFTs for ' + project_name + ' from User 1', async () => {
                    const txResult = await this.gt_logic.depositNFTs(
                        other_user,
                        nft_id,
                        project_id,
                        {from: other_user});
                    const {logs} = txResult;
                    expectEvent.inLogs(logs, 'NFTsDeposited', {
                        by: other_user,
                        project_id: project_id,
                        nft_id: nft_id,
                        volume: (MONETARY_VALUE/2).toString()
                    });
                });
                it('depositing NFTs for ' + project_name + ' from User 2', async () => {
                    const txResult = await this.gt_logic.depositNFTs(
                        deployer_address,
                        nft_id,
                        project_id,
                        {from: deployer_address});
                    const {logs} = txResult;
                    expectEvent.inLogs(logs, 'NFTsDeposited', {
                        by: deployer_address,
                        project_id: project_id,
                        nft_id: nft_id,
                        volume: (MONETARY_VALUE/2).toString()
                    });
                });
                it('checking NFT\'s ownership after depositing for ' + project_name, async () => {
                    expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user}))
                        .to.be.bignumber.equal(ZERO_SHARES.toString());
                    expect(await this.nft_o_logic.getSharesAvailable(deployer_address, nft_id, {from: deployer_address}))
                        .to.be.bignumber.equal(ZERO_SHARES.toString());
                });
                it('checking voting power after depositing NFTs for ' + project_name, async () => {
                    let voting_power = await this.gt_logic.getVotes(other_user, project_id);
                    expect(voting_power).to.be.bignumber.equal(other_user_vpower.add(new BN((MONETARY_VALUE / 2).toString())));

                    voting_power = await this.gt_logic.getVotes(digital_investor, project_id);
                    expect(voting_power).to.be.bignumber.equal(digital_investor_vpower);

                    voting_power = await this.gt_logic.getVotes(deployer_address, project_id);
                    expect(voting_power).to.be.bignumber.equal(deployer_address_vpower.add(new BN((MONETARY_VALUE / 2).toString())));

                    voting_power = await this.gt_logic.getVotes(minter_address, project_id);
                    expect(voting_power).to.be.bignumber.equal(company_account_vpower);
                });
                it('reverting on attempt to deposit already deposited NFTs for ' + project_name + ' for another project', async () => {
                    const another_project_id = project_id === "0" ? "1" : project_id === "1" ? "0" : "some_error";
                    await expectRevert(this.gt_logic.depositNFTs(
                        other_user,
                        nft_id,
                        another_project_id,
                        {from: other_user})
                    , "no NFT ownership is available, can't deposit 0");
                    await expectRevert(this.gt_logic.depositNFTs(
                            deployer_address,
                            nft_id,
                            another_project_id,
                            {from: deployer_address})
                        , "no NFT ownership is available, can't deposit 0");
                });
                it('withdrawing deposited NFTs for ' + project_name, async () => {
                    await this.gt_logic.withdrawNFTs(
                        other_user,
                        nft_id,
                        project_id,
                        {from: other_user});
                    await this.gt_logic.withdrawNFTs(
                        deployer_address,
                        nft_id,
                        project_id,
                        {from: deployer_address});
                });
            }
            for (let _idx = 0; _idx !== NFT_IDS_NOT_OK.length; ++_idx) {
                let nft_id = NFT_IDS_NOT_OK[_idx];
                it('reverting on depositing ' + NFT_ID_TYPES[_idx] +' for ' + project_name, async () => {
                    await expectRevert.unspecified(this.gt_logic.depositNFTs(
                        other_user,
                        nft_id,
                        project_id,
                        {from: other_user}), "Can't deposit a " + NFT_ID_TYPES[_idx]);
                    await expectRevert.unspecified(this.gt_logic.depositNFTs(
                        deployer_address,
                        nft_id,
                        project_id,
                        {from: deployer_address}), "Can't deposit a " + NFT_ID_TYPES[_idx]);
                });
            }
            if (project_id === "1") {
                for (let _idx = 0; _idx !== NFT_IDS_WRONG_PROJECT.length; ++_idx) {
                    let nft_id = NFT_IDS_WRONG_PROJECT[_idx];
                    it('reverting on attempt to deposit NFT ' + nft_id.toString() + ' from another project for ' + project_name, async () => {
                        await expectRevert(this.gt_logic.depositNFTs(
                                other_user,
                                nft_id,
                                project_id,
                                {from: other_user})
                            , " What you are depositing is not owned by this project");
                        await expectRevert(this.gt_logic.depositNFTs(
                                deployer_address,
                                nft_id,
                                project_id,
                                {from: deployer_address})
                            , " What you are depositing is not owned by this project");
                    });
                }
            }
        }
        it('reverting on attempt to deposit a Project NFT', async () => {
            await expectRevert(this.gt_logic.depositNFTs(
                other_user,
                "1", //NFT id is a Project NFT
                "0",
                {from: other_user})
            , "Can't deposit a Project");
        });
        it('reverting on attempt to deposit a non-existent NFT', async () => {
            await expectRevert(this.gt_logic.depositNFTs(
                    other_user,
                    "42",
                    "1", //existing project "2"
                    {from: other_user})
                , "no NFT");
        });
        it('reverting on attempt to deposit for a non-Project', async () => {
            await expectRevert(this.gt_logic.depositNFTs(
                    other_user,
                    "3", //debt from project "1"
                    "7", //existing NFT Collection with id == "7"
                    {from: other_user})
                , "Can't deposit for a non-Project");
        });
        it('reverting on unauthorised attempt to deposit an NFT', async () => {
            await expectRevert(this.gt_logic.depositNFTs(
                    other_user,
                    "3", //debt from project "1"
                    "1",
                    {from: digital_investor})
                , "not approved by Governance Token");
        });
        it('reverting on attempt to move Governance Tokens as ERC20 tokens', async () => {
            await expectRevert(this.gt_logic.transfer(
                    digital_investor, "1",  {from: other_user})
                , "Governance Tokens can be delegated only");
            await expectRevert(this.gt_logic.transferFrom(
                    other_user, digital_investor, "1",  {from: other_user})
                , "Governance Tokens can be delegated only");
        });
    });

    context('withdrawing', function () {
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
            await this.dm_logic.initialize("1", 1, {from:minter_address});

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
            await this.rm_logic.initialize("1", 1, {from:minter_address});

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
            await this.sm_logic.initialize("1", 1, {from:minter_address});

            this.nft_c_impl = await NFTCatalogImplementation.new({from:deployer_address});
            this.nft_c_proxy = await NFTCatalogProxy.new(
                nft_c_name, nft_c_symbol,
                this.nft_c_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                {from:deployer_address});
            this.nft_c_logic = await NFTCatalogImplementation.at(this.nft_c_proxy.address);
            await this.nft_c_logic.initialize("1", 1, {from:minter_address});

            this.nft_o_impl = await NFTOwnershipImplementation.new({from:deployer_address});
            this.nft_o_proxy = await NFTOwnershipProxy.new(
                nft_o_name, nft_o_symbol,
                this.nft_o_impl.address,
                admin_address,
                minter_address,
                {from:deployer_address});
            this.nft_o_logic = await NFTOwnershipImplementation.at(this.nft_o_proxy.address);
            await this.nft_o_logic.initialize("1", 1, {from:minter_address});

            this.nft_t_impl = await NFT_TransactionPool_Implementation.new({from:deployer_address});
            this.nft_t_proxy = await NFT_TransactionPoolProxy.new(
                nft_t_name, nft_t_symbol,
                this.nft_t_impl.address,
                admin_address,
                minter_address,
                {from:deployer_address});
            this.nft_t_logic = await NFT_TransactionPool_Implementation.at(this.nft_t_proxy.address);
            await this.nft_t_logic.initialize("1", 1, {from:minter_address});

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
            await this.pc_logic.initialize("1", 1, {from:minter_address});

            this.gt_impl = await GovernanceTokenImplementation.new({from:deployer_address});
            this.gt_proxy = await GovernanceTokenProxy.new(
                gt_name, gt_symbol,
                this.gt_impl.address,
                admin_address,
                minter_address,
                minter_address, //todo: company account - change that
                {from:deployer_address});
            this.gt_logic = await GovernanceTokenImplementation.at(this.gt_proxy.address);
            await this.gt_logic.initialize("1", 1, {from:minter_address});


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
                "1", 1,
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
            await this.nft_c_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.nft_c_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});

            await this.nft_o_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.nft_o_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.nft_o_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            await this.nft_o_logic.setStakesManager(this.sm_logic.address, {from:minter_address});
            await this.nft_o_logic.setGovernanceToken(this.gt_logic.address, {from:minter_address});

            await this.dm_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.dm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.dm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.dm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.rm_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.rm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.rm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.rm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.rm_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            await this.sm_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.sm_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.sm_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.sm_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});

            await this.pc_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.pc_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.pc_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.pc_logic.setRevenuesManager(this.rm_logic.address, {from:minter_address});
            await this.pc_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            await this.gt_logic.setNativeToken(this.token_logic.address, {from:minter_address});
            await this.gt_logic.setNFTCatalog(this.nft_c_logic.address, {from:minter_address});
            await this.gt_logic.setNFTOwnership(this.nft_o_logic.address, {from:minter_address});
            await this.gt_logic.setProjectCatalog(this.pc_logic.address, {from:minter_address});
            await this.gt_logic.setDebtManager(this.dm_logic.address, {from:minter_address});
            await this.gt_logic.setStakesManager(this.sm_logic.address, {from:minter_address});

            await this.token_logic.setAddressRegistered(other_user, true, {from: minter_address});
            await this.token_logic.setAddressRegistered(digital_investor, true, {from: minter_address});
            await this.token_logic.setAddressRegistered(deployer_address, true, {from: minter_address});

            let updated_amount = await web3.utils.fromWei(new BN(INITIAL_TOKEN_BALANCE), 'wei');
            await this.token_logic.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});
            await this.token_logic.fromEtherToTokens(digital_investor, {from: digital_investor, value: updated_amount});
            await this.token_logic.fromEtherToTokens(deployer_address, {from: deployer_address, value: updated_amount});

        });
        it('creating required instances', async () => {
            //1
            await this.pc_logic.createProject(other_user, "Test project", "Production", "Script", SHARES_TOTAL.toString(), {from: other_user});
            await this.pc_logic.registerProjectBudget(other_user, "1", "1000", "3500", {from: other_user});
            //2
            await this.pc_logic.createProject(deployer_address, "Test project", "Production", "Script", SHARES_TOTAL.toString(), {from: deployer_address});
            await this.pc_logic.registerProjectBudget(deployer_address, "2", "2000", "1000", {from: deployer_address});

            //3
            await this.dm_logic.registerDebt(other_user, "1", MONETARY_VALUE.toString(), "136", SHARES_TOTAL.toString(), {from: minter_address});
            //4
            await this.sm_logic.stake(other_user, MONETARY_VALUE.toString(), "1", SHARES_TOTAL.toString(), {from: other_user});
            //5
            await this.dm_logic.registerDebt(other_user, "1", MONETARY_VALUE.toString(), "136", SHARES_TOTAL.toString(), {from: minter_address});
            //6
            await this.sm_logic.stake(other_user, MONETARY_VALUE.toString(), "1", SHARES_TOTAL.toString(), {from: other_user});
            //7
            await this.nft_c_logic.mint(other_user, "Collection", "www.google.com", "0", "1", SHARES_TOTAL.toString(), {from: other_user});
            //8
            await this.nft_c_logic.mint(other_user, "ProjectArt", "www.google.com", "0", "1", SHARES_TOTAL.toString(), {from: other_user});
            //9
            await this.nft_c_logic.mint(other_user, "Ticket", "www.google.com", "0", "1", SHARES_TOTAL.toString(), {from: other_user});
            //10
            await this.nft_c_logic.mint(other_user, "Other", "www.google.com", "0", "1", SHARES_TOTAL.toString(), {from: other_user});


            const nft_ids = ["3", "4", "5", "6", "7", "8", "9", "10"];
            const is_ether_payment = true;
            let tx_id = await (1);
            for (let idx = 0; idx !== nft_ids.length; ++idx) {
                await this.nft_c_logic.approveTransaction(
                    other_user,
                    deployer_address,
                    nft_ids[idx],
                    (SHARES_TOTAL / 2).toString(),
                    (PRICE / 2).toString(), //price
                    is_ether_payment,
                    {from: other_user});
                await this.nft_c_logic.implementTransaction(tx_id.toString(), {from: deployer_address, value: (PRICE / 2).toString()});
                ++tx_id;
            }
        });

        const PROJECT_IDS = ["0", "1"];
        const PROJECT_NAMES = ["system-wide decision", "project-related decision"];
        const NFT_IDS = [["3", "4"], ["5", "6"]];

        it('depositing', async () => {
            for (let idx = 0; idx !== PROJECT_IDS.length; ++idx) {
                const project_id = PROJECT_IDS[idx];
                await this.gt_logic.depositTokens(other_user, TOKENS_TO_VOTING_POWER.toString(), project_id, {from: other_user});
                await this.gt_logic.depositTokens(digital_investor, (TOKENS_TO_VOTING_POWER * 2).toString(), project_id, {from: digital_investor});

                const _nft_ids = NFT_IDS[idx];
                for (let _idx = 0; _idx !== _nft_ids.length; ++_idx) {
                    const nft_id = _nft_ids[_idx];
                    await this.gt_logic.depositNFTs(other_user, nft_id, project_id, {from: other_user});
                    await this.gt_logic.depositNFTs(deployer_address, nft_id, project_id, {from: deployer_address});
                }
            }
        });


        it('reverting on unauthorised attempt to withdraw an NFT', async () => {
            await expectRevert(this.gt_logic.withdrawNFTs(
                    other_user,
                    "3", //debt from project "1"
                    "1",
                    {from: digital_investor})
                , "not approved by Governance Token");
        });

        it('reverting on attempt to withdraw an NFT that is not deposited', async () => {
            await expectRevert(this.gt_logic.withdrawNFTs(
                    other_user,
                    "1", //NFT id is a Project NFT
                    "9", //not deposited NFT
                    {from: other_user})
                , "NFT is not deposited");
        });
        it('reverting on attempt to withdraw an NFT from non-existent project', async () => {
            await expectRevert(this.gt_logic.withdrawNFTs(
                    other_user,
                    "42", //no project like with this ID
                    "3",
                    {from: other_user})
                , "NFT is not deposited");
        });
        it('reverting on attempt to withdraw an NFT from a Project where it was not deposited', async () => {
            await expectRevert(this.gt_logic.withdrawNFTs(
                    other_user,
                    "1", //project Ok
                    "3", //nft with id "3" was deposited for project "0"
                    {from: other_user})
                , "NFT is not deposited");
        });
        it('reverting on attempt to withdraw a non-existent NFT', async () => {
            await expectRevert(this.gt_logic.withdrawNFTs(
                    other_user,
                    "1", //project Ok
                    "42", //no nft with such id
                    {from: other_user})
                , "NFT is not deposited");
        });


        let other_user_balance;
        let digital_investor_balance;
        let deployer_address_balance;
        let company_account_balance;

        let other_user_vpower;
        let digital_investor_vpower;
        let deployer_address_vpower;
        let company_account_vpower;

        for (let idx = 0; idx !== PROJECT_IDS.length; ++idx) {
            let project_id = PROJECT_IDS[idx];
            let project_name = PROJECT_NAMES[idx];

            it('recording voting power before withdrawing Tokens for ' + project_name, async () => {
                other_user_vpower = await this.gt_logic.getVotes(other_user, project_id);
                digital_investor_vpower = await this.gt_logic.getVotes(digital_investor, project_id);
                deployer_address_vpower = await this.gt_logic.getVotes(deployer_address, project_id);
                company_account_vpower = await this.gt_logic.getVotes(minter_address, project_id);
            });
            it('recording balances before withdrawing Tokens for ' + project_name, async () => {
                other_user_balance = await this.token_logic.balanceOf(other_user);
                digital_investor_balance = await this.token_logic.balanceOf(digital_investor);
                deployer_address_balance = await this.token_logic.balanceOf(deployer_address);
                company_account_balance = await this.token_logic.balanceOf(minter_address); //company address
            });
            it('withdrawing Tokens from ' + project_name + ' for User 1', async () => {
                const txResult = await this.gt_logic.withdrawTokens(
                    other_user,
                    TOKENS_TO_VOTING_POWER.toString(),
                    project_id,
                    {from: other_user});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'TokensWithdrawn', {
                    by: other_user,
                    project_id: project_id,
                    volume: TOKENS_TO_VOTING_POWER.toString()
                });
            });
            it('withdrawing Tokens from ' + project_name + ' for User 2', async () => {
                const txResult = await this.gt_logic.withdrawTokens(
                    digital_investor,
                    (TOKENS_TO_VOTING_POWER * 2).toString(),
                    project_id,
                    {from: digital_investor});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'TokensWithdrawn', {
                    by: digital_investor,
                    project_id: project_id,
                    volume: (TOKENS_TO_VOTING_POWER * 2).toString()
                });
            });
            it('checking balances after withdrawing Tokens for ' + project_name, async () => {
                let token_balance = await this.token_logic.balanceOf(other_user);
                let _tokens_to_voting_power = new BN(TOKENS_TO_VOTING_POWER.toString());
                expect(token_balance).to.be.bignumber.equal(other_user_balance.add(_tokens_to_voting_power));

                token_balance = await this.token_logic.balanceOf(digital_investor);
                expect(token_balance).to.be.bignumber.equal(digital_investor_balance.add(new BN((TOKENS_TO_VOTING_POWER * 2).toString())));

                token_balance = await this.token_logic.balanceOf(deployer_address);
                expect(token_balance).to.be.bignumber.equal(deployer_address_balance);

                token_balance = await this.token_logic.balanceOf(minter_address); //company address
                expect(token_balance).to.be.bignumber.equal(company_account_balance.sub(new BN((TOKENS_TO_VOTING_POWER * 3).toString())));
            });
            it('checking voting power after withdrawing Tokens for ' + project_name, async () => {
                let voting_power = await this.gt_logic.getVotes(other_user, project_id);
                expect(voting_power).to.be.bignumber.equal(other_user_vpower.sub(new BN(TOKENS_TO_VOTING_POWER.toString())));

                voting_power = await this.gt_logic.getVotes(digital_investor, project_id);
                expect(voting_power).to.be.bignumber.equal(digital_investor_vpower.sub(new BN((TOKENS_TO_VOTING_POWER * 2).toString())));

                voting_power = await this.gt_logic.getVotes(deployer_address, project_id);
                expect(voting_power).to.be.bignumber.equal(deployer_address_vpower);

                voting_power = await this.gt_logic.getVotes(minter_address, project_id);
                expect(voting_power).to.be.bignumber.equal(company_account_vpower);
            });

            let _nft_ids = NFT_IDS[idx];
            for (let _idx = 0; _idx !== _nft_ids.length; ++_idx) {
                let nft_id = _nft_ids[_idx];

                it('checking NFT\'s ownership before withdrawing for ' + project_name, async () => {
                    expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user}))
                        .to.be.bignumber.equal(ZERO_SHARES.toString());
                    expect(await this.nft_o_logic.getSharesAvailable(deployer_address, nft_id, {from: deployer_address}))
                        .to.be.bignumber.equal(ZERO_SHARES.toString());
                });
                it('recording voting power before withdrawing NFT for ' + project_name, async () => {
                    other_user_vpower = await this.gt_logic.getVotes(other_user, project_id);
                    digital_investor_vpower = await this.gt_logic.getVotes(digital_investor, project_id);
                    deployer_address_vpower = await this.gt_logic.getVotes(deployer_address, project_id);
                    company_account_vpower = await this.gt_logic.getVotes(minter_address, project_id);
                });
                it('withdrawing NFTs from ' + project_name + ' for User 1', async () => {
                    let owners = await this.nft_o_logic.getOwnershipForNFT(nft_id);
                    const txResult = await this.gt_logic.withdrawNFTs(
                        other_user,
                        nft_id,
                        project_id,
                        {from: other_user});
                    const {logs} = txResult;
                    expectEvent.inLogs(logs, 'NFTsWithdrawn', {
                        by: other_user,
                        project_id: project_id,
                        nft_id: nft_id,
                        volume: (MONETARY_VALUE/2).toString()
                    });
                });
                it('withdrawing NFTs from ' + project_name + ' for User 2', async () => {
                    let owners = await this.nft_o_logic.getOwnershipForNFT(nft_id);
                    const txResult = await this.gt_logic.withdrawNFTs(
                        deployer_address,
                        nft_id,
                        project_id,
                        {from: deployer_address});
                    const {logs} = txResult;
                    expectEvent.inLogs(logs, 'NFTsWithdrawn', {
                        by: deployer_address,
                        project_id: project_id,
                        nft_id: nft_id,
                        volume: (MONETARY_VALUE/2).toString()
                    });
                });
                it('checking NFT\'s ownership after withdrawing for ' + project_name, async () => {
                    expect(await this.nft_o_logic.getSharesAvailable(other_user, nft_id, {from: other_user}))
                        .to.be.bignumber.equal((SHARES_TOTAL/2).toString());
                    expect(await this.nft_o_logic.getSharesAvailable(deployer_address, nft_id, {from: deployer_address}))
                        .to.be.bignumber.equal((SHARES_TOTAL/2).toString());
                });
                it('checking voting power after withdrawing NFTs for ' + project_name, async () => {
                    let voting_power = await this.gt_logic.getVotes(other_user, project_id);
                    expect(voting_power).to.be.bignumber.equal(other_user_vpower.sub(new BN((MONETARY_VALUE / 2).toString())));

                    voting_power = await this.gt_logic.getVotes(digital_investor, project_id);
                    expect(voting_power).to.be.bignumber.equal(digital_investor_vpower);

                    voting_power = await this.gt_logic.getVotes(deployer_address, project_id);
                    expect(voting_power).to.be.bignumber.equal(deployer_address_vpower.sub(new BN((MONETARY_VALUE / 2).toString())));

                    voting_power = await this.gt_logic.getVotes(minter_address, project_id);
                    expect(voting_power).to.be.bignumber.equal(company_account_vpower);
                });
            }
        }

    });
});
