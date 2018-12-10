const HDWalletProvider = require("truffle-hdwallet-provider"); // WEB3.one
const HDWalletProviderPrivkey = require("truffle-hdwallet-provider-privkey");

require('dotenv').config();  // Store environment-specific variable from '.env' to process.env

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "ganache",
      port: 7545,
      network_id: "*",
      //gasPrice: 1,
      //gas: 9000000,
    },
    ropsten: {
      network_id: 3,
      host: "geth",
      port: 8545,
      from: "0x3C47f1DeE211caA7616102042EF9BE18Da858574",
      gasPrice: 1,
      gas: 6012388
    },
    // If you're using an HDWalletProvider, it must be Web3 1.0 enabled or your migration will hang.
    infuraRopsten: {
      provider: () =>
        // must be a web3-1.0.0, otherwise truffle commands may hang in CI
        new HDWalletProvider(process.env.WALLET_MNEMONIC, "https://ropsten.infura.io/v3/" + process.env.INFURA_KEY, 0, 6),
      network_id: '3'
    },
    infuraRopstenTest: {
      // must be a web3-1.0.0, otherwise truffle commands may hang in CI
      provider: () =>
        new HDWalletProvider(process.env.WALLET_PASSWORDS.split(","), "https://ropsten.infura.io/v3/" + process.env.INFURA_KEY, 0, 6),
      network_id: '3'
    }
  },
  rpc: {
    host: 'localhost',
    post:8080
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
