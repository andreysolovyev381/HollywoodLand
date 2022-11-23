// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library GovernorStructs {
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

}
