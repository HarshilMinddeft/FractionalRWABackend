require('dotenv').config();
const { cleanEnv, str, port, url } = require('envalid');

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development',
  }),
  PORT: port({ default: 3001 }),

  // MongoDB
  MONGO_URI: str(),

  // Pinata / IPFS
  PINATA_JWT: str(),
  GATEWAY_URL: str(),

  // Blockchain
  PRIVATE_KEY: str(),
  DEPLOYER_PRIVATE_KEY: str(),

  // Blockpass KYC
  BLOCKPASS_API_KEY: str(),
  BLOCKPASS_SERVICE_ID: str(),
});

module.exports = env;
