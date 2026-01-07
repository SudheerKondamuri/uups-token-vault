// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenVaultV1.sol";

contract TokenVaultV2 is TokenVaultV1 {
    uint256 public yieldRate;
    mapping(address => uint256) public lastYieldTimestamp;
    bool public isPaused;

    uint256[47] private __gapV2;

    function initializeV2(uint256 _yieldRate) public reinitializer(2) {
        yieldRate = _yieldRate;
    }

    function setYieldRate(uint256 _yieldRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        yieldRate = _yieldRate;
    }

    function getYieldRate() external view returns (uint256) {
        return yieldRate;
    }

    function pauseDeposits() external onlyRole(DEFAULT_ADMIN_ROLE) {
        isPaused = true;
    }

    function unpauseDeposits() external onlyRole(DEFAULT_ADMIN_ROLE) {
        isPaused = false;
    }

    function isDepositsPaused() external view returns (bool) {
        return isPaused;
    }

    function getUserYield(address user) public view returns (uint256) {
        if (lastYieldTimestamp[user] == 0 || _balances[user] == 0) return 0;

        uint256 timeElapsed = block.timestamp - lastYieldTimestamp[user];
        return (_balances[user] * yieldRate * timeElapsed) / (365 days * 10000);
    }

    function _updateYield(address user) internal {
        uint256 pending = getUserYield(user);
        uint256 vaultBalance = IERC20(assetToken).balanceOf(address(this));

        if (pending > 0 && vaultBalance >= _totalDeposits + pending) {
            _balances[user] += pending;
            _totalDeposits += pending;
        }
        lastYieldTimestamp[user] = block.timestamp;
    }

    function claimYield() external returns (uint256) {
        uint256 beforeBalance = _balances[msg.sender];
        _updateYield(msg.sender);
        return _balances[msg.sender] - beforeBalance;
    }

    function deposit(uint256 amount) public override {
        require(!isPaused, "Vault is paused");
        _updateYield(msg.sender);
        super.deposit(amount);
    }

    function withdraw(uint256 amount) public override {
        _updateYield(msg.sender);
        super.withdraw(amount);
    }
}