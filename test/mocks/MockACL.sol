// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockACL {
    mapping(uint256 => mapping(address => bool)) internal allowed;

    function allowTransient(uint256 ciphertext, address account) external {
        allowed[ciphertext][account] = true;
    }

    function allow(uint256 handle, address account) external {
        allowed[handle][account] = true;
    }

    function cleanTransientStorage() external {
        // no-op in mock
    }

    function isAllowed(uint256 handle, address account) external view returns (bool) {
        return allowed[handle][account];
    }

    function allowForDecryption(uint256[] memory handlesList) external {
        for (uint256 i = 0; i < handlesList.length; i++) {
            allowed[handlesList[i]][msg.sender] = true;
        }
    }
}
