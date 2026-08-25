const { ethers } = require('ethers');
const env = require('../config/env');

// Singleton — instantiated once at startup, shared across the process
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.soniclabs.com');
const deployer = new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY, provider);

module.exports = { provider, deployer };
