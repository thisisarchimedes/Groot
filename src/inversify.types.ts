const TYPES = {
    ILoggerAll: "ILoggerAll",
    IConfigServiceAWS: "IConfigServiceAWS",
    Environment: Symbol.for("Environment"),
    Region: Symbol.for("Region"),
    MainLocalNodeURI: Symbol.for("MainLocalNodeURI"),
    AltLocalNodeURI: Symbol.for("AltLocalNodeURI"),
    BlockchainNodeLocalMain: Symbol.for("BlockchainNodeLocalMain"),
    BlockchainNodeLocalAlt: Symbol.for("BlockchainNodeLocalAlt"),
    Groot: "Groot",
    ServiceName: Symbol.for("ServiceName"),
    IBlockchainReader: Symbol.for("IBlockchainReader"),
};

export { TYPES };