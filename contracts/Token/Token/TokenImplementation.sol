//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "./TokenStorage.sol";
import "../../Libs/ERC777Wrapper.sol";
import "../../Libs/ExternalFuncs.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TokenImplementation is ExternalTokenStorage, ERC777Wrapper, AccessControl, Initializable, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address;

    constructor()
    ERC777Wrapper("Token Implementation, not for usage", "DONT_USE", new address[](0))
    {}

    function initialize(
        string memory version,
        address[] memory default_operators,
        uint256 this_impl_supply
    ) public initializer onlyRole(MINTER_ROLE) {
        if (this_impl_supply != 0){
            require (
                totalSupply().add(this_impl_supply) <= m_max_supply,
                ExternalFuncs.getErrorMsg("You are allowed to mint: ", m_max_supply.sub(totalSupply()))
            );
            _mint(m_company_account, this_impl_supply, "", "", false);
        }

        _defaultOperatorsArray = default_operators;
        for (uint256 i = 0; i < default_operators.length; i++) {
            _defaultOperators[default_operators[i]] = true;
        }

        m_implementation_version.push(version);

        // register interfaces
        _ERC1820_REGISTRY.setInterfaceImplementer(address(this), keccak256("ERC777Token"), address(this));
        _ERC1820_REGISTRY.setInterfaceImplementer(address(this), keccak256("ERC20Token"), address(this));
    }
    function mint(uint256 amount) public onlyRole(MINTER_ROLE) {
        require (totalSupply().add(amount) <= m_max_supply, "Amount that is about to be minted breaks the Max Supply");
        _mint(msg.sender, amount, bytes(''), bytes(''), false);
    }

    //burn and operatorBurn of ERC777 make all required checks and update _totalSupply that holds current Tokens qty
    //no need to override those funcs

    //todo: DRY
    function getCurrentVersion () public view returns (string memory) {
        return m_implementation_version[m_implementation_version.length - 1];
    }
    //todo: DRY
    function getVersionHistory () public view returns (string[] memory) {
        return m_implementation_version;
    }


    function setPriceOracle (address price_oracle) public onlyRole(MINTER_ROLE) {
        require (price_oracle != address(0), "Address should be valid");
        m_price_oracle = IPriceOracle(price_oracle);
        m_price_oracle_is_set = true;
        emit PriceOracleSet(msg.sender, price_oracle);
    }

    function getTokenPrice () public view returns (uint256) {
        require (m_price_oracle_is_set, "Price Oracle should be set");
        return m_price_oracle.getPrice();
    }
    function fromEtherToTokens(address from) public payable {
        require(isOperatorFor(msg.sender, from), "Must be an operator for address");

        uint256 tokens_to_buy = msg.value.mul(getTokenPrice());
        uint256 company_token_balance = this.balanceOf(m_company_account);
        require(tokens_to_buy > 0, "You need to send some more ether, what you provide is not enough for transaction");
        require(tokens_to_buy <= company_token_balance, "Not enough tokens in the reserve");

        _send(m_company_account, msg.sender, tokens_to_buy, bytes(''), bytes(''), false);
    }
    function fromTokensToEther(uint256 tokens_to_sell, address to) public nonReentrant {
        require(isOperatorFor(msg.sender, to), "Must be an operator for address");
        require(tokens_to_sell > 0, "You need to sell at least some tokens");

        // Check that the user's token balance is enough to do the swap
        uint256 user_token_balance = this.balanceOf(msg.sender);
        require(user_token_balance >= tokens_to_sell, "Your balance is lower than the amount of tokens you want to sell");

        uint256 eth_to_transfer = tokens_to_sell.div(getTokenPrice());
        uint256 company_eth_balance = address(this).balance;
        require(company_eth_balance >= eth_to_transfer, "HWLT Owner doesn't have enough funds to accept this sell request");

        _send(msg.sender, m_company_account, tokens_to_sell, bytes(''), bytes(''), false);
        (bool sent, bytes memory data) = msg.sender.call{value: eth_to_transfer}("");
        require(sent, "Failed to send Ether");
    }

    /**
    function bulkTransfer (address[] memory from, address[] memory to, uint256[] memory volumes, uint256 data_length) public {
        uint256 i = 0;
        for (i; i != data_length; ++i) {
            require (this.isOperatorFor(msg.sender, from[i]), "You MUST be an operator for Sender address");
            require(from[i] != address(0), "ERC777: send from the zero address");
            require(to[i] != address(0), "ERC777: send to the zero address");
            require(_balances[from[i]] >= volumes[i], "ERC777: transfer amount exceeds balance");
        }

        for (i; i != data_length; ++i) {
            //---------------- send ----------------------
            _callTokensToSend(msg.sender, from[i], to[i], volumes[i], bytes(''), bytes(''));
            //----------------- move -----------------------
            _beforeTokenTransfer(msg.sender, from[i], to[i], volumes[i]);
            uint256 fromBalance = _balances[from[i]];
        unchecked {
            _balances[from[i]] = fromBalance - volumes[i];
        }
            _balances[to[i]] += volumes[i];
            emit Sent(msg.sender, from[i], to[i], volumes[i], bytes(''), bytes(''));
            emit Transfer(from[i], to[i], volumes[i]);
            //---------------- send ----------------------
            _callTokensReceived(msg.sender, from[i], to[i], volumes[i], bytes(''), bytes(''), false);
            //-----------------------------------------------
        }
    }
    */
    //todo: for testing only, must be removed before deployment
    event BeforeTokenTransfer();
    //todo: for testing only, must be removed before deployment
    function mintInternal(address to, uint256 amount, bytes memory userData, bytes memory operatorData) public {
        _mint(to, amount, userData, operatorData);
    }

    //todo: for testing only, must be removed before deployment
    function mintInternalExtended(address to, uint256 amount, bytes memory userData, bytes memory operatorData, bool requireReceptionAck) public {
        _mint(to, amount, userData, operatorData, requireReceptionAck);
    }

    //todo: for testing only, must be removed before deployment
    function approveInternal(address holder, address spender, uint256 value) public {
        _approve(holder, spender, value);
    }

    //todo: for testing only, must be removed before deployment
    function _beforeTokenTransfer(address, address, address, uint256) internal override {
        emit BeforeTokenTransfer();
    }
}
