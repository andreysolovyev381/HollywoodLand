//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../../node_modules/abdk-libraries-solidity/ABDKMath64x64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

library ExternalFuncs {
    using SafeMath for uint256;

    // from here https://medium.com/coinmonks/math-in-solidity-part-4-compound-interest-512d9e13041b
    /*
        function pow (int128 x, uint n)
        public pure returns (int128 r) {
            r = ABDKMath64x64.fromUInt (1);
            while (n > 0) {
                if (n % 2 == 1) {
                    r = ABDKMath64x64.mul (r, x);
                    n -= 1;
                } else {
                    x = ABDKMath64x64.mul (x, x);
                    n /= 2;
                }
            }
        }
    */

    function compound (uint principal, uint ratio, uint n) public pure returns (uint) {
        return ABDKMath64x64.mulu (
            ABDKMath64x64.pow ( //pow - original code
                ABDKMath64x64.add (ABDKMath64x64.fromUInt (1), ABDKMath64x64.divu (ratio, 10**6)), //(1+r), where r is allowed to be one hundredth of a percent, ie 5/100/100
                n), //(1+r)^n
            principal); //A_0 * (1+r)^n
    }
    function getPeriodForCompound (uint256 timestamp_start, uint256 timestamp_finish, uint256 duration_period) public pure returns (uint256) {
        require (timestamp_finish >= timestamp_start, "Check submitted timestamps, can't proceed them");
        uint256 n_periods = (timestamp_finish.sub(timestamp_start)).div(duration_period);
        return n_periods;
    }

    function getAccruedInterest (uint256 base_amount, uint256 rate, uint256 n_periods) public pure returns (uint256) {
        uint256 interest = compound(base_amount, rate, n_periods).sub(base_amount);
        return interest;
    }

    function getTotalPayout (uint256 base_amount, uint256 rate, uint256 timestamp_start, uint256 timestamp_finish, uint256 duration_period) public pure returns (uint256, uint256) {
        uint256 n_periods = getPeriodForCompound(timestamp_start, timestamp_finish, duration_period);
        uint256 interest = getAccruedInterest(base_amount, rate, n_periods);
        return (base_amount, interest);
    }

    //todo: must be updgraded before usage
    function prng(address _address) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, _address )));
    }

    function Today () public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    function getErrorMsg (string memory text, uint value) public pure returns (string memory) {
        return string(abi.encodePacked(text, Strings.toString(value)));
    }

    function toLower(string memory str) public pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            // Uppercase character...
            if (( uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                // So we add 32 to make it lowercase
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

    function equal(string memory _a, string memory _b) public pure returns (bool) {
        return keccak256(abi.encodePacked(_a)) == keccak256(abi.encodePacked(_b));
    }

    /// from:
    //    https://github.com/ethereum/dapp-bin/blob/master/library/stringUtils.sol

    /// @dev Finds the index of the first occurrence of _needle in _haystack
    function indexOf(string memory _haystack, string memory _needle) public pure returns (int)
    {
        bytes memory h = bytes(_haystack);
        bytes memory n = bytes(_needle);
        if(h.length < 1 || n.length < 1 || (n.length > h.length))
            return -1;
        else if(h.length > (2**128 -1)) // since we have to be able to return -1 (if the char isn't found or input error), this function must return an "int" type with a max length of (2^128 - 1)
            return -1;
        else
        {
            uint subindex = 0;
            for (uint i = 0; i < h.length; i ++)
            {
                if (h[i] == n[0]) // found the first char of b
                {
                    subindex = 1;
                    while(subindex < n.length && (i + subindex) < h.length && h[i + subindex] == n[subindex]) // search until the chars don't match or until we reach the end of a or b
                    {
                        subindex++;
                    }
                    if(subindex == n.length)
                        return int(i);
                }
            }
            return -1;
        }
    }

    function concat(string memory a, string memory b) public pure returns (string memory) {
        return string(abi.encodePacked(a,b));
    }

    //OZ implementation from Strings.sol
    function toString(uint256 value) public pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }


    function toString(address account) public pure returns(string memory) {
        return toString(abi.encodePacked(account));
    }

//    function toString(uint256 value) public pure returns(string memory) {
//        return toString(abi.encodePacked(value));
//    }

//    function toString(bytes32 value) public pure returns(string memory) {
//        return toString(abi.encodePacked(value));
//    }

    function toString(bytes memory data) public pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

}//!lib
