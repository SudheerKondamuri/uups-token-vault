// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract MockERC20 is ERC20 {
    constructor() ERC20("MockERC20", "MERC20") {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
    function mint (address to, uint256 amount) external {
        _mint(to, amount);
    }
}