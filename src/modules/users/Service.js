const path = require('path');
const User = require('../../entities/User');
const { ethers } = require('ethers');
const { deployer } = require('../../utils/ethers.util');
const AppError = require('../../utils/AppError');

// Contract ABIs
const identityStorageAbi = require(path.join(
  process.cwd(),
  'artifacts/contracts/RwaERC-3643/registry/implementation/IdentityRegistryStorage.sol/IdentityRegistryStorage.json',
)).abi;
const IdentityAbi = require(path.join(process.cwd(), 'artifacts/contracts/onchainId/Identity.json')).abi;
const IdentityBytecode = require(path.join(
  process.cwd(),
  'artifacts/contracts/onchainId/Identity.json',
)).bytecode;

const REGISTRY_STORAGE_CA = '0x35d821976B30A0AE64adD0328aa2aeAc05d3F2dc';
const CLAIM_ISSUER_CA = '0x1ffaEC74657E24754D18b4Fa6EB8cEdBF3b06663';

class Service {
  /**
   * Create a new user record.
   */
  async addUser({ refId, userWalletAddress, kycActive }) {
    const user = new User({ refId, userWalletAddress, kycActive });
    await user.save();
    return user;
  }

  /**
   * Fetch a user by their Blockpass refId.
   * @param {string} refId
   */
  async getUserByRefId(refId) {
    const user = await User.findOne({ refId });
    if (!user) throw new AppError('User not found.', 404);
    return user;
  }

  /**
   * Handle a Blockpass webhook event.
   * On KYC approval: deploys an Identity contract, adds a KYC claim, and
   * registers the identity in the IdentityRegistryStorage contract.
   *
   * @param {{ status: string, refId: string }} payload
   */
  async handleBlockpassWebhook({ status, refId }) {
    if (status !== 'approved') {
      console.info(`[Blockpass] KYC status update for ${refId}: ${status}`);
      return;
    }

    console.info(`[Blockpass] KYC approved for ${refId}`);

    const user = await User.findOne({ refId });
    if (!user) {
      console.warn(`[Blockpass] User not found for refId: ${refId}`);
      return;
    }

    const userWallet = user.userWalletAddress;

    // ── Check if identity already registered ──────────────────────────────
    const registryStorage = new ethers.Contract(
      REGISTRY_STORAGE_CA,
      identityStorageAbi,
      deployer,
    );

    const existingIdentity = await registryStorage.storedIdentity(userWallet);
    if (existingIdentity !== ethers.ZeroAddress) {
      console.info(`[Blockpass] Identity already registered for ${userWallet}`);
      return;
    }

    // ── Deploy Identity.sol ───────────────────────────────────────────────
    console.info(`[Blockpass] Deploying Identity.sol for wallet: ${userWallet}`);
    const identityFactory = new ethers.ContractFactory(IdentityAbi, IdentityBytecode, deployer);
    const identity = await identityFactory.deploy(deployer.address, false);
    await identity.waitForDeployment();
    const identityAddress = await identity.getAddress();
    console.info(`[Blockpass] Identity.sol deployed at: ${identityAddress}`);

    // ── Add KYC claim to identity ─────────────────────────────────────────
    const topic = 1;
    const data = ethers.toUtf8Bytes('KYC-verified');
    const uri = `Kyc-BlockPass-${refId}`;

    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256', 'bytes'],
      [identityAddress, topic, data],
    );
    const dataHash = ethers.keccak256(encoded);
    const signature = await deployer.signMessage(ethers.getBytes(dataHash));
    const dataHex = ethers.hexlify(data);

    const identityContract = new ethers.Contract(identityAddress, IdentityAbi, deployer);
    const addClaimTx = await identityContract.addClaim(
      topic, 1, CLAIM_ISSUER_CA, signature, dataHex, uri,
    );
    const claimReceipt = await addClaimTx.wait();
    console.info(`[Blockpass] Claim added in block: ${claimReceipt.blockNumber}`);

    // ── Register identity in IdentityRegistryStorage ──────────────────────
    const addIdentityTx = await registryStorage.addIdentityToStorage(
      userWallet, identityAddress, 1,
    );
    const identityReceipt = await addIdentityTx.wait();
    console.info(`[Blockpass] Identity registered. Tx: ${identityReceipt.hash}`);
    console.info(`[Blockpass] KYC process completed for ${refId}`);
  }
}

module.exports = Service;
