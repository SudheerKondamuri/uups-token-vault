// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenVaultV1 is Initializable, AccessControlUpgradeable, UUPSUpgradeable {    
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    address public assetToken;
    uint256 public depositFee; 
    uint256 private _totalDeposits;
    mapping(address => uint256) private _balances;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _token, address _admin, uint256 _fee) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        assetToken = _token;
        depositFee = _fee;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
    }

    function deposit(uint256 amount) external virtual {
        uint256 fee = (amount * depositFee) / 10000;
        uint256 netAmount = amount - fee;

        IERC20(assetToken).transferFrom(msg.sender, address(this), amount);

        _balances[msg.sender] += netAmount;
        _totalDeposits += netAmount;
    }

    function withdraw(uint256 amount) external virtual {
        require(_balances[msg.sender] >= amount, "Insufficient balance");

        _balances[msg.sender] -= amount;
        _totalDeposits -= amount;

        IERC20(assetToken).transfer(msg.sender, amount);
    }

    function balanceOf(address user) external view returns (uint256) {
        return _balances[user];
    }

    function totalDeposits() external view returns (uint256) {
        return _totalDeposits;
    }

    function getDepositFee() external view returns (uint256) {
        return depositFee;
    }

    function getImplementationVersion() external pure returns (string memory) {
        return "V1";
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    uint256[50] private __gap;
}