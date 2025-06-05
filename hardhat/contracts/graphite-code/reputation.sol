// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

interface IKYCContract {
    function level(address addr) external view returns (uint);
}

interface IFeeContract {
    function paidFee(address addr) external view returns (bool);

    function paidFeeBlock(address addr) external view returns (uint);
}

library System {
    IKYCContract constant kyc = IKYCContract(0x0000000000000000000000000000000000001001);
    IFeeContract constant fee = IFeeContract(0x0000000000000000000000000000000000001000);

    function nonce(address addr) internal view returns (uint64) {
        // 0xc8 - nonce precompiled contract address
        (bool success, bytes memory output) = address(0xc8).staticcall(abi.encodePacked(addr));
        require(success);
        return uint64(bytes8(output));
    }
}

contract Reputation {
    /**
     * @dev Returns reputation x 100 for provided account.
     */
    function getReputation(address addr) external view returns (uint) {
        uint reputation = 0;

        // activation
        if (System.fee.paidFee(addr)) {
            reputation += 100;
            // creation date = activation block number, make sense only if activation already happened
            uint creationBlock = System.fee.paidFeeBlock(addr);
            uint d = block.number - creationBlock;
            if (d >= 100000) {
                reputation += 100;
            } else if (d >= 50000) {
                reputation += 70;
            } else if (d >= 10000) {
                reputation += 50;
            }
        }

        // kyc level
        uint kycLevel = System.kyc.level(addr);
        if (kycLevel >= 2) {
            reputation += 300;
        } else if (kycLevel >= 1) {
            reputation += 100;
        }

        // quantity of transactions = nonce
        uint qTx = System.nonce(addr);
        if (qTx >= 1000) {
            reputation += 100;
        } else if (qTx >= 500) {
            reputation += 80;
        } else if (qTx >= 100) {
            reputation += 50;
        } else if (qTx >= 10) {
            reputation += 30;
        } else if (qTx >= 1) {
            reputation += 5;
        }

        // diff = all_in - all_out = balance
        uint diff = addr.balance;
        if (diff >= 1 ether / 10) {
            reputation += 50;
        }

        return reputation;
    }
}