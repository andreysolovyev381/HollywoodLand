require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });

const { expectEvent, expectRevert, singletons, constants, BN, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect, assert} = require('chai');
const { should } = require('chai').should();

const TokenProxy = artifacts.require('TokenProxy');
const TokenImplementation = artifacts.require('TokenImplementation');
const PriceOracle = artifacts.require('PriceOracle');

contract('HollywoodLand Token - BRD',
    ([registryFunder, deployer_address, other_user, operator, admin_address, minter_address]) => {

        let amount = new BN('42');
        const initialSupply = new BN('10000000000000000000000');
        const maxSupply     = new BN('20000000000000000000000');
        const name = 'HollywoodLandToken';
        const symbol = 'HWLT';
        const token_price = new BN('100');
        const data = web3.utils.sha3('HollywoodLandToken_TestData');
        const operatorData = web3.utils.sha3('HollywoodLandToken_TestOperatorData');
        const empty_bytes = web3.utils.asciiToHex("");

        context('general checks', async () => {
            it('checking the addresses are different', async () => {
                assert.isFalse(minter_address == admin_address);
                assert.isFalse(minter_address == deployer_address);
                assert.isFalse(minter_address == other_user);
                assert.isFalse(admin_address == deployer_address);
                assert.isFalse(admin_address == other_user);
                assert.isFalse(deployer_address == other_user);
            });
        });

        context('supply volume', function () {
            describe('minting Tokens', function () {
                before(async () => {
                        this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                        this.impl1 = await TokenImplementation.new({from:deployer_address});
                        this.token_proxy = await TokenProxy.new(
                            name, symbol, maxSupply,
                            this.impl1.address,
                            admin_address,
                            minter_address,
                            {from:deployer_address});
                        this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                        await this.logic_1.initialize(
                            "1.0.0",
                            [operator],
                            initialSupply,
                            {from:minter_address});
                    this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
                    await this.price_oracle.setPrice(token_price, {from: minter_address});
                    await this.logic_1.setPriceOracle(this.price_oracle.address, {from: minter_address} );
                });
                it('check initial Supply', async () => {
                    let balance = await this.logic_1.totalSupply({from: other_user});
                    balance = await web3.utils.fromWei(balance, 'ether');
                    assert.equal(balance, '10000', "Should be equal to 10 - initial supply");
                });
                it('adding Tokens from minter', async () => {

                    await this.logic_1.mint('5000000000000000000000', {from: minter_address});

                    let balance = await this.logic_1.totalSupply({from: other_user});
                    balance = await web3.utils.fromWei(balance, 'ether');
                    assert.equal(balance, '15000', "Should be equal to 15 - initial supply + minted");

                    balance = await this.logic_1.balanceOf(minter_address, {from: minter_address});
                    balance = await web3.utils.fromWei(balance, 'ether');
                    assert.equal(balance, '15000', "Should be equal to 15 - same as a supply");
                });
                describe('reverting on wrong Minting Attempts', function () {
                    before(async () => {
                        this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                        this.impl1 = await TokenImplementation.new({from:deployer_address});
                        this.token_proxy = await TokenProxy.new(
                            name, symbol, maxSupply,
                            this.impl1.address,
                            admin_address,
                            minter_address,
                            {from:deployer_address});
                        this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                        await this.logic_1.initialize(
                            "1.0.0",
                            [operator],
                            initialSupply,
                            {from:minter_address});
                        this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
                        await this.price_oracle.setPrice(token_price, {from: minter_address});
                        await this.logic_1.setPriceOracle(this.price_oracle.address, {from: minter_address} );
                    });
                    it('unauthorized attempt by admin', async () => {
                        await expectRevert.unspecified(
                            this.logic_1.mint('1000000000000000000000', {from: admin_address}));
                    });
                    it('unauthorized attempt by average Joe', async () => {
                        await expectRevert.unspecified(
                            this.logic_1.mint('1000000000000000000000', {from: other_user}));
                    });
                    it('attempt that exceeds Max Supply', async () => {
                        await this.logic_1.mint('5000000000000000000000', {from: minter_address});
                        let balance = await this.logic_1.totalSupply({from: other_user});
                        assert.equal(balance.toString(), '15000000000000000000000', "Should be equal to 15 - same as a total supply");

                        await expectRevert(this.logic_1.mint('15000000000000000000000', {from: minter_address}) //+15000
                            , "Amount that is about to be minted breaks the Max Supply");
                    });
                });
            });
            describe('burning Tokens', function () {
                before(async () => {
                    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                    this.impl1 = await TokenImplementation.new({from:deployer_address});
                    this.token_proxy = await TokenProxy.new(
                        name, symbol, maxSupply,
                        this.impl1.address,
                        admin_address,
                        minter_address,
                        {from:deployer_address});
                    this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                    await this.logic_1.initialize(
                        "1.0.0",
                        [operator],
                        initialSupply,
                        {from:minter_address});
                    this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
                    await this.price_oracle.setPrice(token_price, {from: minter_address});
                    await this.logic_1.setPriceOracle(this.price_oracle.address, {from: minter_address} );
                });
                it('burning from Total Supply by minter', async () => {
                    let balance = await this.logic_1.balanceOf(minter_address, {from: minter_address});
                    balance = await web3.utils.fromWei(balance, 'ether');
                    assert.equal(balance, '10000', "Should be equal to 10 - initial Supply");

                    await this.logic_1.burn('5000000000000000000000', empty_bytes, {from: minter_address});

                    balance = await this.logic_1.totalSupply({from: other_user});
                    balance = await web3.utils.fromWei(balance, 'ether');
                    assert.equal(balance, '5000', "Should be equal to 5 after a burn of 5");

                    balance = await this.logic_1.balanceOf(minter_address, {from: minter_address});
                    balance = await web3.utils.fromWei(balance, 'ether');
                    assert.equal(balance, '5000', "Should be equal to 5 after a burn of 5");
                });
                it('burning tokens of average Joe', async () => {
                    await this.logic_1.fromEtherToTokens(other_user, {from: other_user, value: amount});
                    const user_balance = await this.logic_1.balanceOf(other_user, {from: other_user});
                    assert.equal(user_balance.toString(), '4200');

                    await this.logic_1.burn('4200', empty_bytes, {from: other_user});

                    let balance = await this.logic_1.totalSupply({from: other_user});
                    assert.equal(balance.toString(), '4999999999999999995800', "Should be equal to 4999999999999999995800 after a burn of 4200");

                    balance = await this.logic_1.balanceOf(other_user, {from: other_user});
                    assert.equal(balance.toString(), '0', "Should be equal to 0 after a burn of entire balance");
                });
                describe('reverting on wrong Burning Attempts', function () {
                    before(async () => {
                        this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                        this.impl1 = await TokenImplementation.new({from:deployer_address});
                        this.token_proxy = await TokenProxy.new(
                            name, symbol, maxSupply,
                            this.impl1.address,
                            admin_address,
                            minter_address,
                            {from:deployer_address});
                        this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                        await this.logic_1.initialize(
                            "1.0.0",
                            [operator],
                            initialSupply,
                            {from:minter_address});
                        this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
                        await this.price_oracle.setPrice(token_price, {from: minter_address});
                        await this.logic_1.setPriceOracle(this.price_oracle.address, {from: minter_address} );
                    });
                    it('wrong attempt by admin', async () => {
                        await expectRevert(
                            this.logic_1.burn('1000000000000000000000',empty_bytes, {from: deployer_address})
                            , "ERC777: burn amount exceeds balance"
                        );
                    });
                    it('wrong attempt by average Joe', async () => {
                        await expectRevert(
                            this.logic_1.burn('1000000000000000000000', empty_bytes, {from: other_user})
                            , "ERC777: burn amount exceeds balance"
                        );
                    });
                    it('attempt that exceeds Max Supply', async () => {
                        await expectRevert(this.logic_1.burn('15000000000000000000000', empty_bytes, {from: minter_address})
                            , "ERC777: burn amount exceeds balance");
                    });
                });
            });
        });

        context('price', function () {
            before(async () => {
                this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                this.impl1 = await TokenImplementation.new({from:deployer_address});
                this.token_proxy = await TokenProxy.new(
                    name, symbol, maxSupply,
                    this.impl1.address,
                    admin_address,
                    minter_address,
                    {from:deployer_address});
                this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                await this.logic_1.initialize(
                    "1.0.0",
                    [operator],
                    initialSupply,
                    {from:minter_address});
                this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
                await this.price_oracle.setPrice(token_price, {from: minter_address});
                await this.logic_1.setPriceOracle(this.price_oracle.address, {from: minter_address} );
            });
            it('check initial Price', async () => {
                let price = await this.logic_1.getTokenPrice({from: other_user});
                assert.equal(price.toString(), "100");
                price = await this.logic_1.getTokenPrice({from: minter_address});
                assert.equal(price.toString(), "100");
            });
            it('setting Price by admin', async () => {
                let txResult = await this.price_oracle.setPrice("90",{from: minter_address});
                const {logs} = txResult;
                expectEvent.inLogs(logs, 'PriceSet', {
                    by: minter_address,
                    value: '90',
                });
                let price = await this.logic_1.getTokenPrice({from: other_user});
                assert.equal(price.toString(), "90");
            });
            describe('reverting on unauthorized Price change', function () {
                before(async () => {
                    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                    this.impl1 = await TokenImplementation.new({from:deployer_address});
                    this.token_proxy = await TokenProxy.new(
                        name, symbol, maxSupply,
                        this.impl1.address,
                        admin_address,
                        minter_address,
                        {from:deployer_address});
                    this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                    await this.logic_1.initialize(
                        "1.0.0",
                        [operator],
                        initialSupply,
                        {from:minter_address});
                    this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
                    await this.price_oracle.setPrice(token_price, {from: minter_address});
                    await this.logic_1.setPriceOracle(this.price_oracle.address, {from: minter_address} );
                });
                it('unauthorized attempt by admin', async () => {
                    await expectRevert.unspecified(
                        this.price_oracle.setPrice("90", {from: admin_address}));
                });
                it('unauthorized attempt by average Joe', async () => {
                    await expectRevert.unspecified(
                        this.price_oracle.setPrice("90", {from: other_user}));
                });
            });
            describe('price Oracles absence, deploy, change', function () {
                before(async () => {
                    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                    this.impl1 = await TokenImplementation.new({from:deployer_address});
                    this.token_proxy = await TokenProxy.new(
                        name, symbol, maxSupply,
                        this.impl1.address,
                        admin_address,
                        minter_address,
                        {from:deployer_address});
                    this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                    await this.logic_1.initialize(
                        "1.0.0",
                        [operator],
                        initialSupply,
                        {from:minter_address});
                    this.price_oracle_1 = await PriceOracle.new(minter_address, {from:deployer_address});
                    this.price_oracle_2 = await PriceOracle.new(minter_address, {from:deployer_address});
                });
                it('reverting on no Price Oracle set', async () => {
                    await expectRevert(
                        this.logic_1.getTokenPrice({from: minter_address})
                        , "Price Oracle should be set"
                    );
                });
                it('revert on unauthorized attempt to set a Price Oracle by proxy', async () => {
                    await expectRevert.unspecified(
                        this.logic_1.setPriceOracle(this.price_oracle_2.address, {from: deployer_address}));
                });
                it('set successfully a Price Oracle by proxy', async () => {
                    let txResult = await this.logic_1.setPriceOracle(this.price_oracle_1.address, {from: minter_address});
                    const {logs} = txResult;
                    expectEvent.inLogs(logs, 'PriceOracleSet', {
                        by: minter_address,
                        oracle: this.price_oracle_1.address,
                    });
                });
                it('revert on unauthorized attempt to set a price by average Joe', async () => {
                    await expectRevert.unspecified(
                        this.price_oracle_1.setPrice("90", {from: other_user}));
                });
                it('set successfully a price', async () => {
                    let txResult = await this.price_oracle_1.setPrice(token_price, {from: minter_address});
                    const {logs} = txResult;
                    expectEvent.inLogs(logs, 'PriceSet', {
                        by: minter_address,
                        value: '100',
                    });
                    const price = await this.logic_1.getTokenPrice({from: other_user});
                    assert.equal(price.toString(), "100");
                });
                it('set successfully a New Price Oracle by proxy', async () => {
                    await this.price_oracle_2.setPrice("90", {from: minter_address});

                    let txResult = await this.logic_1.setPriceOracle(this.price_oracle_2.address, {from: minter_address});
                    const {logs} = txResult;
                    expectEvent.inLogs(logs, 'PriceOracleSet', {
                        by: minter_address,
                        oracle: this.price_oracle_2.address,
                    });
                    const price = await this.logic_1.getTokenPrice({from: other_user});
                    assert.equal(price.toString(), "90");
                });
            });
        });

        context('conversions', function () {
            describe('from Ether to Tokens', function () {
                before(async () => {
                    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                    this.impl1 = await TokenImplementation.new({from:deployer_address});
                    this.token_proxy = await TokenProxy.new(
                        name, symbol, maxSupply,
                        this.impl1.address,
                        admin_address,
                        minter_address,
                        {from:deployer_address});
                    this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                    await this.logic_1.initialize(
                        "1.0.0",
                        [operator],
                        initialSupply,
                        {from:minter_address});
                    this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
                    await this.price_oracle.setPrice(token_price, {from: minter_address});
                    await this.logic_1.setPriceOracle(this.price_oracle.address, {from: minter_address} );
                });
                it('contract balance should starts with 0 ETH', async () => {
                    let balance = await web3.eth.getBalance(this.logic_1.address);
                    assert.equal(balance, 0);
                });
                //minter transaction - non-systematic test, see Reverting on Wrong Balances
                it('reverting on Minter tries to extract complete Balance', async () => {
                    let free_float = await this.logic_1.balanceOf(minter_address);
                    assert.equal(free_float.toString(), '10000000000000000000000');

                    await expectRevert(
                        this.logic_1.fromTokensToEther(free_float, minter_address, {from: minter_address}),
                        "HWLT Owner doesn't have enough funds to accept this sell request");

                    free_float = await this.logic_1.balanceOf(minter_address);
                    assert.equal(free_float, '10000000000000000000000');
                });
                it('basic Convertion', async () => {
                    let updated_amount = await web3.utils.fromWei(amount, 'wei');

                    // Send 42 ether to the contract.
                    // `fromEtherToTokens` is a payable method.
                    await this.logic_1.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});

                    // Check the contract balance.
                    let contractBalance = await web3.eth.getBalance(this.logic_1.address);
                    contractBalance = await web3.utils.fromWei(contractBalance, 'wei');

                    assert.equal(contractBalance, updated_amount);

                    const free_float = await this.logic_1.balanceOf(minter_address);
                    assert.equal(free_float.toString(), '9999999999999999995800');

                    const user_balance = await this.logic_1.balanceOf(other_user);
                    assert.equal(user_balance.toString(), '4200');
                });
                describe('reverting on Wrong Balances', function () {
                    before(async () => {
                        this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                        this.impl1 = await TokenImplementation.new({from:deployer_address});
                        this.token_proxy = await TokenProxy.new(
                            name, symbol, maxSupply,
                            this.impl1.address,
                            admin_address,
                            minter_address,
                            {from:deployer_address});
                        this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                        await this.logic_1.initialize(
                            "1.0.0",
                            [operator],
                            initialSupply,
                            {from:minter_address});
                        this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
                        await this.price_oracle.setPrice(token_price, {from: minter_address});
                        await this.logic_1.setPriceOracle(this.price_oracle.address, {from: minter_address} );
                    });
                    it('sending 0 ETH', async () => {
                        await expectRevert(
                            this.logic_1.fromEtherToTokens(other_user, {from: other_user, value: 0}),
                            'You need to send some more ether, what you provide is not enough for transaction'
                        );
                    });
                    it('sending more ETH than Total Supply', async () => {
                        let updated_amount = new BN('20000000000000000000000');
                        await expectRevert(
                            this.logic_1.fromEtherToTokens(other_user, {from: other_user, value: updated_amount}),
                            'Not enough tokens in the reserve'
                        );
                    });
                });
            });
            describe('from Tokens to Ether', function () {
                before(async () => {
                    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                    this.impl1 = await TokenImplementation.new({from:deployer_address});
                    this.token_proxy = await TokenProxy.new(
                        name, symbol, maxSupply,
                        this.impl1.address,
                        admin_address,
                        minter_address,
                        {from:deployer_address});
                    this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                    await this.logic_1.initialize(
                        "1.0.0",
                        [operator],
                        initialSupply,
                        {from:minter_address});
                    this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
                    await this.price_oracle.setPrice(token_price, {from: minter_address});
                    await this.logic_1.setPriceOracle(this.price_oracle.address, {from: minter_address} );
                });
                it('basic Conversion', async () => {
                    // Send 42 ether to the contract.
                    // `fromEtherToTokens` is a payable method.
                    let updated_amount = await web3.utils.fromWei(amount, 'wei');
                    await this.logic_1.fromEtherToTokens(other_user, {from: other_user, value: updated_amount});

                    let user_token_balance = await this.logic_1.balanceOf(other_user);
                    assert.equal(user_token_balance.toString(), '4200');
                    updated_amount = new BN (user_token_balance.toString());

                    let token_ether_balance = await web3.eth.getBalance(this.logic_1.address);
                    token_ether_balance = await web3.utils.fromWei(token_ether_balance, 'wei');
                    assert.equal(token_ether_balance, '42');

                    // Sells tokens for 42 ether
                    await this.logic_1.fromTokensToEther(updated_amount, other_user, {from: other_user});

                    token_ether_balance = await web3.eth.getBalance(this.logic_1.address);
                    token_ether_balance = await web3.utils.fromWei(token_ether_balance, 'wei');
                    assert.equal(token_ether_balance, '0');

                    const free_float = await this.logic_1.balanceOf(minter_address);
                    assert.equal(free_float, '10000000000000000000000');

                    user_token_balance = await this.logic_1.balanceOf(other_user);
                    assert.equal(user_token_balance.toString(), '0');
                });
                describe('reverting on Wrong Balances', function () {
                    before(async () => {
                        this.erc1820 = await singletons.ERC1820Registry(registryFunder);
                        this.impl1 = await TokenImplementation.new({from:deployer_address});
                        this.token_proxy = await TokenProxy.new(
                            name, symbol, maxSupply,
                            this.impl1.address,
                            admin_address,
                            minter_address,
                            {from:deployer_address});
                        this.logic_1 = await TokenImplementation.at(this.token_proxy.address);
                        await this.logic_1.initialize(
                            "1.0.0",
                            [operator],
                            initialSupply,
                            {from:minter_address});
                        this.price_oracle = await PriceOracle.new(minter_address, {from:deployer_address});
                        await this.price_oracle.setPrice(token_price, {from: minter_address});
                        await this.logic_1.setPriceOracle(this.price_oracle.address, {from: minter_address} );
                    });
                    it('sending 0 Tokens', async () => {
                        await expectRevert(
                            this.logic_1.fromTokensToEther(0, other_user, {from: other_user}),
                            'You need to sell at least some tokens'
                        );
                    });
                    it('sending more Tokens than current balance', async () => {
                        let user_token_balance = await this.logic_1.balanceOf(other_user);
                        assert.equal(user_token_balance.toString(), '0');
                        let updated_amount = new BN ('4200');
                        await expectRevert(
                            this.logic_1.fromTokensToEther(updated_amount, other_user, {from: other_user}),
                            'Your balance is lower than the amount of tokens you want to sell'
                        );
                    });
                });
            });
        });
    });
