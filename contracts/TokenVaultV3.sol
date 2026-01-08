// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenVaultV2.sol";

contract TokenVaultV3 is TokenVaultV2 {
    struct WithdrawalRequest {
        uint256 amount;
        uint256 requestTime;
    }

    uint256 public withdrawalDelay;
    mapping(address => WithdrawalRequest) public withdrawalRequests;

    uint256[45] private __gapV3;

    function initializeV3(uint256 _delay) public reinitializer(3) {
        withdrawalDelay = _delay;
    }

    function setWithdrawalDelay(
        uint256 _delaySeconds
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        withdrawalDelay = _delaySeconds;
    }

    function getWithdrawalDelay() external view returns (uint256) {
        return withdrawalDelay;
    }

    function getWithdrawalRequest(
        address user
    ) external view returns (uint256 amount, uint256 requestTime) {
        WithdrawalRequest storage request = withdrawalRequests[user];
        return (request.amount, request.requestTime);
    }

    function requestWithdrawal(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(_balances[msg.sender] >= amount, "Insufficient balance");

        _updateYield(msg.sender);

        withdrawalRequests[msg.sender] = WithdrawalRequest({
            amount: amount,
            requestTime: block.timestamp
        });
    }

    function executeWithdrawal() external returns (uint256) {
        WithdrawalRequest storage request = withdrawalRequests[msg.sender];
        require(request.amount > 0, "No request found");
        require(
            block.timestamp >= request.requestTime + withdrawalDelay,
            "Delay not met"
        );

        uint256 amount = request.amount;
        delete withdrawalRequests[msg.sender];

        super.withdraw(amount);
        return amount;
    }

    function emergencyWithdraw() external returns (uint256) {
        _updateYield(msg.sender);
        uint256 amount = _balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        delete withdrawalRequests[msg.sender];
        super.withdraw(amount);
        return amount;
    }

    function withdraw(uint256) public pure virtual override {
        revert("Use requestWithdrawal and executeWithdrawal");
    }

    function getImplementationVersion()
        external
        pure
        virtual
        override
        returns (string memory)
    {
        return "V3";
    }
}
