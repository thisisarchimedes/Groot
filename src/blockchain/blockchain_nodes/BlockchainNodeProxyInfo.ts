export class BlockchainNodeProxyInfo {
  private constructor(
        public readonly isProxy: boolean,
        public readonly implementationAddress: string,
  ) { }

  static notProxy(): BlockchainNodeProxyInfo {
    return new BlockchainNodeProxyInfo(false, '');
  }

  static proxy(implementationAddress: string): BlockchainNodeProxyInfo {
    return new BlockchainNodeProxyInfo(true, implementationAddress);
  }
}
