//SPDX-License-Identifier: MIT

// from https://solidity-by-example.org/app/iterable-mapping/
// slightly extended
pragma solidity >=0.8.0;

library IterableSet {

    // Iterable set<uint>, using mapping from uint to uint;
    struct Set {
        uint256[] keys;
        mapping(uint256 => uint256) values;
        mapping(uint256 => uint256) indexOf;
        mapping(uint256 => bool) inserted;
    }

    function get(Set storage set, uint key) public view returns (uint) {
        return set.values[key];
    }

    function getKeyAtIndex(Set storage set, uint index) public view returns (uint) {
        return set.keys[index];
    }
    function inserted(Set storage set, uint index) public view returns (bool) {
        return set.inserted[index];
    }

    function size(Set storage set) public view returns (uint) {
        return set.keys.length;
    }

    function insert(Set storage set, uint key) public {
        if (set.inserted[key]) {
            set.values[key] = 0;
        } else {
            set.inserted[key] = true;
            set.values[key] = 0;
            set.indexOf[key] = set.keys.length;
            set.keys.push(key);
        }
    }

    function empty (Set storage set) public view returns (bool) {
        return size(set) == 0;
    }

    function erase(Set storage set, uint key) public {
        if (!set.inserted[key]) {
            return;
        }
        //simple swap and pop
        delete set.inserted[key];
        delete set.values[key];

        uint index = set.indexOf[key];
        uint lastIndex = set.keys.length - 1;
        uint lastKey = set.keys[lastIndex];

        set.indexOf[lastKey] = index;
        delete set.indexOf[key];

        set.keys[index] = lastKey;
        set.keys.pop();
    }
}
