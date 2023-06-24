const { expectEvent, expectRevert, singletons, constants, BN, bignumber, time } = require('@openzeppelin/test-helpers');
const { expect, assert} = require('chai');

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

const ProxyTestingMock = artifacts.require('ProxyTestingMock');


contract('Checking upgrades', (
    [
        registryFunder
        , deployer_address
        , other_user
        , admin_address
        , minter_address
        , digital_investor
        , owner
        , proposer
        , dummy_address
    ]) => {

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

    const gvrn_name = 'HollywoodLand Governor';
    const gvrn_symbol = 'HWLGNR';
    const gvrn_version = '1';

    const SHARES_TOTAL = 100;

    const votingDelay = new BN(4);
    const votingPeriod = new BN(16);
    const proposalThreshold = new BN(0);
    const requiredQuorum = new BN(4);

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
        this.dm_impl_another = await DebtManagerImplementation.new({from:deployer_address});

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
        this.rm_impl_another = await RevenuesManagerImplementation.new({from:deployer_address});

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
        this.sm_impl_another = await StakesManagerImplementation.new({from:deployer_address});

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
        this.nft_c_impl_another = await NFTCatalogImplementation.new({from:deployer_address});

        this.nft_o_impl = await NFTOwnershipImplementation.new({from:deployer_address});
        this.nft_o_proxy = await NFTOwnershipProxy.new(
            nft_o_name, nft_o_symbol,
            this.nft_o_impl.address,
            admin_address,
            minter_address,
            {from:deployer_address});
        this.nft_o_logic = await NFTOwnershipImplementation.at(this.nft_o_proxy.address);
        await this.nft_o_logic.initialize("1", 1, {from:minter_address});
        this.nft_o_impl_another = await NFTOwnershipImplementation.new({from:deployer_address});

        this.nft_t_impl = await NFT_TransactionPool_Implementation.new({from:deployer_address});
        this.nft_t_proxy = await NFT_TransactionPoolProxy.new(
            nft_t_name, nft_t_symbol,
            this.nft_t_impl.address,
            admin_address,
            minter_address,
            {from:deployer_address});
        this.nft_t_logic = await NFT_TransactionPool_Implementation.at(this.nft_t_proxy.address);
        await this.nft_t_logic.initialize("1", 1, {from:minter_address});
        this.nft_t_impl_another = await NFT_TransactionPool_Implementation.new({from:deployer_address});

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
        this.pc_impl_another = await ProjectCatalogImplementation.new({from:deployer_address});

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
        this.gt_impl_another = await GovernanceTokenImplementation.new({from:deployer_address});


        this.gvrn_impl = await GovernorImplementation.new({from:deployer_address});
        this.gvrn_proxy = await GovernorProxy.new(
            gvrn_name, gvrn_symbol,
            this.gvrn_impl.address
            , admin_address
            , minter_address
            , {from:deployer_address});
        this.gvrn_logic = await GovernorImplementation.at(this.gvrn_proxy.address);
        await this.gvrn_logic.initialize(
            "1", 1
            , this.gt_logic.address
            , votingDelay
            , votingPeriod
            , proposalThreshold
            , requiredQuorum
            , {from:minter_address}
        );
        this.gvrn_impl_another = await GovernorImplementation.new({from:deployer_address});



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
            [dummy_address, dummy_address, dummy_address, this.gt_logic.address, this.gvrn_logic.address], //default Operators
            initialSupply,
            {from:minter_address});
        this.impl1_another = await TokenImplementation.new({from:deployer_address});
        this.proxy_impl_mock = await ProxyTestingMock.new({from:deployer_address});
    });

    it('Debt Manager: revert by proxy on unauthorized attempt to get an implementation', async () => {
        await expectRevert.unspecified(this.dm_proxy.implementation({from: minter_address}));
        await expectRevert.unspecified(this.dm_proxy.implementation({from: deployer_address}));
    });
    it('Debt Manager: successful attempt to get an implementation', async () => {
        const curr_impl  = await this.dm_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.dm_impl.address);
    });
    it('Debt Manager: successful attempt to find out that implementation is an implementation', async () => {
        let name  = await this.dm_impl.name({from: other_user});
        expect(name).to.be.equal("Debt Manager Implementation, not for usage");
    });
    it('Debt Manager: revert by proxy on unauthorized attempt to change an implementation', async () => {
        await expectRevert.unspecified(this.dm_proxy.upgradeTo(this.dm_impl_another.address, {from: minter_address}));
        await expectRevert.unspecified(this.dm_proxy.upgradeTo(this.dm_impl_another.address, {from: deployer_address}));
    });
    it('Debt Manager: successful attempt to change an implementation', async () => {
        let curr_impl  = await this.dm_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.dm_impl.address);

        expectEvent(
            await this.dm_proxy.upgradeTo(this.dm_impl_another.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.dm_impl_another.address
            },
        );

        curr_impl  = await this.dm_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.dm_impl_another.address);
    });
    it('Debt Manager: successful attempt attempt to initialize new implementation', async () => {
        let curr_impl_ver  = await this.dm_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("1");

        await this.dm_logic.initialize("2 moonlight", 2, {from:minter_address});

        curr_impl_ver  = await this.dm_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("2 moonlight");
    });
    
    it('Revenue Manager: revert by proxy on unauthorized attempt to get an implementation', async () => {
        await expectRevert.unspecified(this.rm_proxy.implementation({from: minter_address}));
        await expectRevert.unspecified(this.rm_proxy.implementation({from: deployer_address}));
    });
    it('Revenue Manager: successful attempt to get an implementation', async () => {
        const curr_impl  = await this.rm_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.rm_impl.address);
    });
    it('Revenue Manager: successful attempt to find out that implementation is an implementation', async () => {
        let name  = await this.rm_impl.name({from: other_user});
        expect(name).to.be.equal("Revenues Manager Implementation, not for usage");
    });
    it('Revenue Manager: revert by proxy on unauthorized attempt to change an implementation', async () => {
        await expectRevert.unspecified(this.rm_proxy.upgradeTo(this.rm_impl_another.address, {from: minter_address}));
        await expectRevert.unspecified(this.rm_proxy.upgradeTo(this.rm_impl_another.address, {from: deployer_address}));
    });
    it('Revenue Manager: successful attempt to change an implementation', async () => {
        let curr_impl  = await this.rm_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.rm_impl.address);

        expectEvent(
            await this.rm_proxy.upgradeTo(this.rm_impl_another.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.rm_impl_another.address
            },
        );

        curr_impl  = await this.rm_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.rm_impl_another.address);
    });
    it('Revenue Manager: successful attempt attempt to initialize new implementation', async () => {
        let curr_impl_ver  = await this.rm_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("1");

        await this.rm_logic.initialize("2 moonlight", 2, {from:minter_address});

        curr_impl_ver  = await this.rm_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("2 moonlight");
    });

    it('Stakes Manager: revert by proxy on unauthorized attempt to get an implementation', async () => {
        await expectRevert.unspecified(this.sm_proxy.implementation({from: minter_address}));
        await expectRevert.unspecified(this.sm_proxy.implementation({from: deployer_address}));
    });
    it('Stakes Manager: successful attempt to get an implementation', async () => {
        const curr_impl  = await this.sm_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.sm_impl.address);
    });
    it('Stakes Manager: successful attempt to find out that implementation is an implementation', async () => {
        let name  = await this.sm_impl.name({from: other_user});
        expect(name).to.be.equal("Funds Manager Implementation, not for usage");
    });
    it('Stakes Manager: revert by proxy on unauthorized attempt to change an implementation', async () => {
        await expectRevert.unspecified(this.sm_proxy.upgradeTo(this.sm_impl_another.address, {from: minter_address}));
        await expectRevert.unspecified(this.sm_proxy.upgradeTo(this.sm_impl_another.address, {from: deployer_address}));
    });
    it('Stakes Manager: successful attempt to change an implementation', async () => {
        let curr_impl  = await this.sm_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.sm_impl.address);

        expectEvent(
            await this.sm_proxy.upgradeTo(this.sm_impl_another.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.sm_impl_another.address
            },
        );

        curr_impl  = await this.sm_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.sm_impl_another.address);
    });
    it('Stakes Manager: successful attempt attempt to initialize new implementation', async () => {
        let curr_impl_ver  = await this.sm_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("1");

        await this.sm_logic.initialize("2 moonlight", 2, {from:minter_address});

        curr_impl_ver  = await this.sm_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("2 moonlight");
    });

    it('Governance Token: revert by proxy on unauthorized attempt to get an implementation', async () => {
        await expectRevert.unspecified(this.gt_proxy.implementation({from: minter_address}));
        await expectRevert.unspecified(this.gt_proxy.implementation({from: deployer_address}));
    });
    it('Governance Token: successful attempt to get an implementation', async () => {
        const curr_impl  = await this.gt_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.gt_impl.address);
    });
    it('Governance Token: successful attempt to find out that implementation is an implementation', async () => {
        let name  = await this.gt_impl.name({from: other_user});
        expect(name).to.be.equal("Governance Token Implementation, not for usage");
    });
    it('Governance Token: revert by proxy on unauthorized attempt to change an implementation', async () => {
        await expectRevert.unspecified(this.gt_proxy.upgradeTo(this.gt_impl_another.address, {from: minter_address}));
        await expectRevert.unspecified(this.gt_proxy.upgradeTo(this.gt_impl_another.address, {from: deployer_address}));
    });
    it('Governance Token: successful attempt to change an implementation', async () => {
        let curr_impl  = await this.gt_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.gt_impl.address);

        expectEvent(
            await this.gt_proxy.upgradeTo(this.gt_impl_another.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.gt_impl_another.address
            },
        );

        curr_impl  = await this.gt_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.gt_impl_another.address);
    });
    it('Governance Token: successful attempt attempt to initialize new implementation', async () => {
        let curr_impl_ver  = await this.gt_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("1");

        await this.gt_logic.initialize("2 moonlight", 2, {from:minter_address});

        curr_impl_ver  = await this.gt_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("2 moonlight");
    });

    it('Governor: revert by proxy on unauthorized attempt to get an implementation', async () => {
        await expectRevert.unspecified(this.gvrn_proxy.implementation({from: minter_address}));
        await expectRevert.unspecified(this.gvrn_proxy.implementation({from: deployer_address}));
    });
    it('Governor: successful attempt to get an implementation', async () => {
        const curr_impl  = await this.gvrn_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.gvrn_impl.address);
    });
    it('Governor: successful attempt to find out that implementation is an implementation', async () => {
        let name  = await this.gvrn_impl.name({from: other_user});
        expect(name).to.be.equal("Governor Implementation, not for usage");
    });
    it('Governor: revert by proxy on unauthorized attempt to change an implementation', async () => {
        await expectRevert.unspecified(this.gvrn_proxy.upgradeTo(this.gvrn_impl_another.address, {from: minter_address}));
        await expectRevert.unspecified(this.gvrn_proxy.upgradeTo(this.gvrn_impl_another.address, {from: deployer_address}));
    });
    it('Governor: successful attempt to change an implementation', async () => {
        let curr_impl  = await this.gvrn_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.gvrn_impl.address);

        expectEvent(
            await this.gvrn_proxy.upgradeTo(this.gvrn_impl_another.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.gvrn_impl_another.address
            },
        );

        curr_impl  = await this.gvrn_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.gvrn_impl_another.address);
    });
    it('Governor: successful attempt attempt to initialize new implementation', async () => {
        let curr_impl_ver  = await this.gvrn_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("1");

        await this.gvrn_logic.initialize(
            "2 moonlight"
            , 2
            , this.gvrn_logic.address
            , votingDelay
            , votingPeriod
            , proposalThreshold
            , requiredQuorum
            , {from:minter_address}
        );

        curr_impl_ver  = await this.gvrn_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("2 moonlight");
    });
    
    it('NFT Catalog: revert by proxy on unauthorized attempt to get an implementation', async () => {
        await expectRevert.unspecified(this.nft_c_proxy.implementation({from: minter_address}));
        await expectRevert.unspecified(this.nft_c_proxy.implementation({from: deployer_address}));
    });
    it('NFT Catalog: successful attempt to get an implementation', async () => {
        const curr_impl  = await this.nft_c_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.nft_c_impl.address);
    });
    it('NFT Catalog: successful attempt to find out that implementation is an implementation', async () => {
        let name  = await this.nft_c_impl.name({from: other_user});
        expect(name).to.be.equal("NFT Catalog Implementation, not for usage");
    });
    it('NFT Catalog: revert by proxy on unauthorized attempt to change an implementation', async () => {
        await expectRevert.unspecified(this.nft_c_proxy.upgradeTo(this.nft_c_impl_another.address, {from: minter_address}));
        await expectRevert.unspecified(this.nft_c_proxy.upgradeTo(this.nft_c_impl_another.address, {from: deployer_address}));
    });
    it('NFT Catalog: successful attempt to change an implementation', async () => {
        let curr_impl  = await this.nft_c_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.nft_c_impl.address);

        expectEvent(
            await this.nft_c_proxy.upgradeTo(this.nft_c_impl_another.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.nft_c_impl_another.address
            },
        );

        curr_impl  = await this.nft_c_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.nft_c_impl_another.address);
    });
    it('NFT Catalog: successful attempt attempt to initialize new implementation', async () => {
        let curr_impl_ver  = await this.nft_c_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("1");

        await this.nft_c_logic.initialize("2 moonlight", 2, {from:minter_address});

        curr_impl_ver  = await this.nft_c_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("2 moonlight");
    });

    it('NFT Ownership: revert by proxy on unauthorized attempt to get an implementation', async () => {
        await expectRevert.unspecified(this.nft_o_proxy.implementation({from: minter_address}));
        await expectRevert.unspecified(this.nft_o_proxy.implementation({from: deployer_address}));
    });
    it('NFT Ownership: successful attempt to get an implementation', async () => {
        const curr_impl  = await this.nft_o_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.nft_o_impl.address);
    });
    it('NFT Ownership: successful attempt to find out that implementation is an implementation', async () => {
        let name  = await this.nft_o_impl.name({from: other_user});
        expect(name).to.be.equal("Part of NFT Catalog Implementation, not for usage");
    });
    it('NFT Ownership: revert by proxy on unauthorized attempt to change an implementation', async () => {
        await expectRevert.unspecified(this.nft_o_proxy.upgradeTo(this.nft_o_impl_another.address, {from: minter_address}));
        await expectRevert.unspecified(this.nft_o_proxy.upgradeTo(this.nft_o_impl_another.address, {from: deployer_address}));
    });
    it('NFT Ownership: successful attempt to change an implementation', async () => {
        let curr_impl  = await this.nft_o_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.nft_o_impl.address);

        expectEvent(
            await this.nft_o_proxy.upgradeTo(this.nft_o_impl_another.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.nft_o_impl_another.address
            },
        );

        curr_impl  = await this.nft_o_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.nft_o_impl_another.address);
    });
    it('NFT Ownership: successful attempt attempt to initialize new implementation', async () => {
        let curr_impl_ver  = await this.nft_o_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("1");

        await this.nft_o_logic.initialize("2 moonlight", 2, {from:minter_address});

        curr_impl_ver  = await this.nft_o_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("2 moonlight");
    });

    it('NFT Tx Pool: revert by proxy on unauthorized attempt to get an implementation', async () => {
        await expectRevert.unspecified(this.nft_t_proxy.implementation({from: minter_address}));
        await expectRevert.unspecified(this.nft_t_proxy.implementation({from: deployer_address}));
    });
    it('NFT Tx Pool: successful attempt to get an implementation', async () => {
        const curr_impl  = await this.nft_t_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.nft_t_impl.address);
    });
    it('NFT Tx Pool: successful attempt to find out that implementation is an implementation', async () => {
        let name  = await this.nft_t_impl.name({from: other_user});
        expect(name).to.be.equal("Part of NFT Catalog Implementation, not for usage");
    });
    it('NFT Tx Pool: revert by proxy on unauthorized attempt to change an implementation', async () => {
        await expectRevert.unspecified(this.nft_t_proxy.upgradeTo(this.nft_t_impl_another.address, {from: minter_address}));
        await expectRevert.unspecified(this.nft_t_proxy.upgradeTo(this.nft_t_impl_another.address, {from: deployer_address}));
    });
    it('NFT Tx Pool: successful attempt to change an implementation', async () => {
        let curr_impl  = await this.nft_t_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.nft_t_impl.address);

        expectEvent(
            await this.nft_t_proxy.upgradeTo(this.nft_t_impl_another.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.nft_t_impl_another.address
            },
        );

        curr_impl  = await this.nft_t_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.nft_t_impl_another.address);
    });
    it('NFT Tx Pool: successful attempt attempt to initialize new implementation', async () => {
        let curr_impl_ver  = await this.nft_t_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("1");

        await this.nft_t_logic.initialize("2 moonlight", 2, {from:minter_address});

        curr_impl_ver  = await this.nft_t_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("2 moonlight");
    });


    it('Project Catalog: revert by proxy on unauthorized attempt to get an implementation', async () => {
        await expectRevert.unspecified(this.pc_proxy.implementation({from: minter_address}));
        await expectRevert.unspecified(this.pc_proxy.implementation({from: deployer_address}));
    });
    it('Project Catalog: successful attempt to get an implementation', async () => {
        const curr_impl  = await this.pc_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.pc_impl.address);
    });
    it('Project Catalog: successful attempt to find out that implementation is an implementation', async () => {
        let name  = await this.pc_impl.name({from: other_user});
        expect(name).to.be.equal("Project Catalog Implementation, not for usage");
    });
    it('Project Catalog: revert by proxy on unauthorized attempt to change an implementation', async () => {
        await expectRevert.unspecified(this.pc_proxy.upgradeTo(this.pc_impl_another.address, {from: minter_address}));
        await expectRevert.unspecified(this.pc_proxy.upgradeTo(this.pc_impl_another.address, {from: deployer_address}));
    });
    it('Project Catalog: successful attempt to change an implementation', async () => {
        let curr_impl  = await this.pc_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.pc_impl.address);

        expectEvent(
            await this.pc_proxy.upgradeTo(this.pc_impl_another.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.pc_impl_another.address
            },
        );

        curr_impl  = await this.pc_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.pc_impl_another.address);
    });
    it('Project Catalog: successful attempt attempt to initialize new implementation', async () => {
        let curr_impl_ver  = await this.pc_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("1");

        await this.pc_logic.initialize("2 moonlight", 2, {from:minter_address});

        curr_impl_ver  = await this.pc_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("2 moonlight");
    });


    it('Token: revert by proxy on unauthorized attempt to get an implementation', async () => {
        await expectRevert.unspecified(this.token_proxy.implementation({from: minter_address}));
        await expectRevert.unspecified(this.token_proxy.implementation({from: deployer_address}));
    });
    it('Token: successful attempt to get an implementation', async () => {
        const curr_impl  = await this.token_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.impl1.address);
    });
    it('Token: successful attempt to find out that implementation is an implementation', async () => {
        let name  = await this.impl1.name({from: other_user});
        expect(name).to.be.equal("Token Implementation, not for usage");
    });
    it('Token: revert by proxy on unauthorized attempt to change an implementation', async () => {
        await expectRevert.unspecified(this.token_proxy.upgradeTo(this.impl1_another.address, {from: minter_address}));
        await expectRevert.unspecified(this.token_proxy.upgradeTo(this.impl1_another.address, {from: deployer_address}));
    });
    it('Token: successful attempt to change an implementation', async () => {
        let curr_impl  = await this.token_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.impl1.address);

        expectEvent(
            await this.token_proxy.upgradeTo(this.impl1_another.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.impl1_another.address
            },
        );

        curr_impl  = await this.token_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.impl1_another.address);
    });
    it('Token: successful attempt attempt to initialize new implementation', async () => {
        let curr_impl_ver  = await this.token_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("1");

        await this.token_logic.initialize("2 moonlight", 2, [], initialSupply, {from:minter_address});

        curr_impl_ver  = await this.token_logic.getCurrentVersion({from: other_user});
        expect(curr_impl_ver).to.be.equal("2 moonlight");
    });

    it('Token as an example: checking that another implementation works', async () => {
        let curr_impl = await this.token_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.impl1_another.address);

        expectEvent(
            await this.token_proxy.upgradeTo(this.proxy_impl_mock.address, {from: admin_address}),
            'Upgraded',
            {
                implementation: this.proxy_impl_mock.address
            },
        );

        curr_impl  = await this.token_proxy.implementation({from: admin_address});
        expect(curr_impl).to.be.equal(this.proxy_impl_mock.address);
        this.proxy_impl_mock_logic = await ProxyTestingMock.at(this.token_proxy.address);
    });
    it('Token as an example: call Implementation specific func', async () => {
        const test_str = await this.proxy_impl_mock_logic.proxyTesting({from: other_user});
        expect(test_str).to.be.equal("For testing Proxy only");
    });
    // it('Token as an example: revert Proxy admin call', async () => {
    //     expectRevert.unspecified(await this.proxy_impl_mock_logic.proxyTesting({from: admin_address}));
    // });
    it('Token as an example: revert on call of absent Implementation specific func', async () => {
        console.log("If uncommented then appropriately fails with \"TypeError: this.proxy_impl_mock_logic.name is not a function\"");
        // expectRevert.unspecified(await this.proxy_impl_mock_logic.name({from: other_user}));
    });
});
