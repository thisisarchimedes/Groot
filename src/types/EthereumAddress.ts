import { ethers } from 'ethers';

type Address = string

export default class EthereumAddress {
    private normalizedAddress: Address;

    constructor(address: Address) {
        // Normalize the address to a checksummed version
        // Throws and error if the address is invalid
        this.normalizedAddress = ethers.getAddress(address);
    }

    // Override toString to return the normalized (checksummed) address
    public toString = (): Address => this.normalizedAddress;

    // Returns the address in all lowercase
    public toLowerCase = (): Address => this.normalizedAddress.toLowerCase();
}