// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @dev Minimal mock of the TFHE executor used in tests.
 * This mock returns plaintext values for trivialEncrypt and returns
 * verifyCiphertext result decoded from the provided proof (ABI-encoded uint256).
 * fheAdd simply performs plain addition of the underlying values.
 */
contract MockTFHEExecutor {
    function fheAdd(uint256 lhs, uint256 rhs, bytes1 /* scalarByte */) external pure returns (uint256 result) {
        return lhs + rhs;
    }

    function fheSub(uint256 lhs, uint256 rhs, bytes1 /* scalarByte */) external pure returns (uint256 result) {
        return lhs - rhs;
    }

    function fheMul(uint256 lhs, uint256 rhs, bytes1 /* scalarByte */) external pure returns (uint256 result) {
        return lhs * rhs;
    }

    function trivialEncrypt(uint256 ct, bytes1 /* toType */) external pure returns (uint256 result) {
        // For testing, encode plaintext as the returned ciphertext handle (identity)
        return ct;
    }

    function trivialEncrypt(bytes memory ct, bytes1 /* toType */) external pure returns (uint256 result) {
        // Return the keccak256 of the bytes to provide a stable handle
        return uint256(keccak256(ct));
    }

    function verifyCiphertext(
        bytes32 /* inputHandle */,
        address /* callerAddress */,
        bytes memory inputProof,
        bytes1 /* inputType */
    ) external pure returns (uint256 result) {
        // For tests, assume the proof is abi-encoded uint256 representing the plaintext.
        if (inputProof.length == 0) return 0;
        result = abi.decode(inputProof, (uint256));
    }

    // Fallbacks for unused functions to satisfy interface
    function fheDiv(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs / rhs; }
    function fheRem(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs % rhs; }
    function fheBitAnd(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs & rhs; }
    function fheBitOr(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs | rhs; }
    function fheBitXor(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs ^ rhs; }
    function fheShl(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs << rhs; }
    function fheShr(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs >> rhs; }
    function fheRotl(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return (lhs << rhs) | (lhs >> (256 - rhs)); }
    function fheRotr(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return (lhs >> rhs) | (lhs << (256 - rhs)); }
    function fheEq(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs == rhs ? 1 : 0; }
    function fheNe(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs != rhs ? 1 : 0; }
    function fheGe(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs >= rhs ? 1 : 0; }
    function fheGt(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs > rhs ? 1 : 0; }
    function fheLe(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs <= rhs ? 1 : 0; }
    function fheLt(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs < rhs ? 1 : 0; }
    function fheMin(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs < rhs ? lhs : rhs; }
    function fheMax(uint256 lhs, uint256 rhs, bytes1) external pure returns (uint256) { return lhs > rhs ? lhs : rhs; }
    function fheNeg(uint256 ct) external pure returns (uint256) { return uint256(-int256(ct)); }
    function fheNot(uint256 ct) external pure returns (uint256) { return ~ct; }
    function fheIfThenElse(uint256 control, uint256 ifTrue, uint256 ifFalse) external pure returns (uint256) { return control != 0 ? ifTrue : ifFalse; }
    function fheRand(bytes1) external pure returns (uint256) { return 0; }
    function fheRandBounded(uint256 upperBound, bytes1 /* randType */) external pure returns (uint256) { if (upperBound == 0) return 0; return upperBound - 1; }
}
