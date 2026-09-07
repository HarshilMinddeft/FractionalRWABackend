require('dotenv').config();
const { cleanEnv, str, port, url, num } = require('envalid');

// Matches a 32-byte hex private key, with or without the 0x prefix.
const PRIVATE_KEY_RE = /^(0x)?[0-9a-fA-F]{64}$/;

const privateKey = str({ default: undefined });
const address = str({ default: undefined });

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development',
  }),
  PORT: port({ default: 3001 }),

  // Frontend origin allowed via CORS in production.
  CLIENT_URL: url({ default: 'http://localhost:3000' }),

  // MongoDB
  MONGO_URI: str(),

  // Pinata / IPFS
  PINATA_JWT: str(),
  GATEWAY_URL: str(),
  
  // Blockchain
  RPC_URL: url({ default: 'https://robinhood-testnet.drpc.org' }),
  PRIVATE_KEY: str(),
  DEPLOYER_PRIVATE_KEY: str(),

  // Owns the IdFactory — `createIdentity` is onlyOwner, so whichever account
  // this key belongs to MUST be the IdFactory's owner or every identity
  // creation reverts with OwnableUnauthorizedAccount. Defaults to the deployer
  // key so existing single-key setups keep working.
  ID_ISSUER_PRIVATE_KEY: privateKey,

  // Signs ERC-735 KYC claims. Must be registered as a purpose-3 (CLAIM) key on
  // the ClaimIssuer at CLAIM_ISSUER_ADDRESS, otherwise ClaimIssuer.isClaimValid
  // returns false and the identity never verifies. Defaults to the deployer key.
  CLAIM_SIGNER_PRIVATE_KEY: privateKey,

  // ── OnchainID / T-REX contract addresses ────────────────────────────────────
  ID_FACTORY_ADDRESS: address,
  IDENTITY_REGISTRY_ADDRESS: address,
  CLAIM_ISSUER_ADDRESS: address,

  // ISO 3166-1 numeric country code recorded at registration. 784 = UAE.
  DEFAULT_COUNTRY_CODE: num({ default: 784 }),

  // Blockpass KYC
  BLOCKPASS_API_KEY: str(),
  BLOCKPASS_SERVICE_ID: str(),
});

// envalid's `str()` can't express "valid private key", so validate the shape
// here — a malformed key otherwise fails deep inside ethers at first use,
// long after startup.
for (const name of ['PRIVATE_KEY', 'DEPLOYER_PRIVATE_KEY', 'ID_ISSUER_PRIVATE_KEY', 'CLAIM_SIGNER_PRIVATE_KEY']) {
  const value = env[name];
  if (value && !PRIVATE_KEY_RE.test(value)) {
    throw new Error(`${name} is not a valid private key — expected 64 hex characters.`);
  }
}

module.exports = env;
