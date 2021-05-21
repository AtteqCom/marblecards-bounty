// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


contract EIP712Base {

    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256(bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));

    bytes32 internal domainSeperator;

    uint internal transactionsFromChainId;

    /**
     * @param _transactionsFromChainId only transactions from this chain will be supported.
     */
    constructor(string memory name, string memory version, uint _transactionsFromChainId) {
        transactionsFromChainId = _transactionsFromChainId;
        domainSeperator = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            keccak256(bytes(name)),
            keccak256(bytes(version)),
            transactionsFromChainId,
            address(this)
        ));
    }

    function getChainID() internal view returns (uint256 id) {
        return transactionsFromChainId;
    }

    function getDomainSeperator() private view returns(bytes32) {
        return domainSeperator;
    }

    /**
    * Accept message hash and returns hash message in EIP712 compatible form
    * So that it can be used to recover signer from signature signed using EIP712 formatted data
    * https://eips.ethereum.org/EIPS/eip-712
    * "\\x19" makes the encoding deterministic
    * "\\x01" is the version byte to make it compatible to EIP-191
    */
    function toTypedMessageHash(bytes32 messageHash) internal view returns(bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", getDomainSeperator(), messageHash));
    }

}
