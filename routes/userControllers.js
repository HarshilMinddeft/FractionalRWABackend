const userData = require('../models/UserModel.js')
const identityStorageArti = require('../artifacts/contracts/RwaERC-3643/registry/implementation/IdentityRegistryStorage.sol/IdentityRegistryStorage.json')
const onchainIdArti = require('@onchain-id/solidity/contracts/artifacts/contracts/Identity.sol/Identity.json')
const claimIssuer = require('@onchain-id/solidity/contracts/artifacts/contracts/ClaimIssuer.sol/ClaimIssuer.json')
const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

class userController {

async addUser(req, res) {
    try {
        const {userId, refId, userWalletAddress, kycActive } = req.body;
        console.log(req.body)

        if (!userId ||!refId || !userWalletAddress ||!kycActive ) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const newUserData = new userData({
            userId,
            refId,
            userWalletAddress: userWalletAddress.toLowerCase(),
            kycActive,
        });
        await newUserData.save();

        res.status(201).json({ message: "Stream added successfully.", UserData: newUserData });
    } catch (error) {
        console.error("Error adding stream:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

async getUserByRefId(req, res) {
    try {
      const { refId } = req.params;
      console.log(req.params)
      if (!refId) {
        return res.status(400).json({ message: "refId is required." });
      }
      const user = await userData.findOne({ refId });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      res.status(200).json({ user });
    } catch (error) {
      console.error("Error fetching user by refId:", error.message);
      res.status(500).json({ message: "Internal server error." });
    }
  }

async blockpasswebhook(req, res) {
  const payload = req.body;
  console.log("Webhook received at", new Date().toISOString());
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("RAW PAYLOAD",payload)

  const { status, refId } = payload;

  if (status === "approved") {
    console.log(`KYC approved for ${refId}`);

     try {
      // ✅ Fetch user from database directly using Mongoose
      const user = await userData.findOne({ refId });

      if (!user) {
        console.log("User not found for refId:", refId);
        return res.status(404).json({ message: "User not found." });
      }

      const userWallet = user.userWalletAddress;
      console.log("Deploying Identity.sol for wallet:", userWallet);

      const identityFactory = new ethers.ContractFactory(
        onchainIdArti.abi,
        onchainIdArti.bytecode,
        deployer
      );

      const identity = await identityFactory.deploy(deployer.address); // or userWallet if you want them to be owner
      await identity.waitForDeployment();

      const identityAddress = await identity.getAddress();
      console.log("✅ Identity.sol deployed at:", identityAddress);

    } catch (err) {
      console.error("❌ Error during Identity deployment:", err.message);
      return res.status(500).json({ message: "Internal error during Identity deployment" });
    }

  } else {
    console.log(`KYC status update for ${refId}: ${status}`);
  }
  res.status(200).send("Webhook received");
};
}

module.exports = new userController();


// app.get("/api/kyc/status/:refId", async (req, res) => {
//   const { refId } = req.params;
//   try {
//     const resp = await axios.get(
//       `https://kyc.blockpass.org/kyc/1.0/connect/${CLIENT_ID}/refId/${encodeURIComponent(refId)}`,
//       {
//         headers: {
//           Authorization: API_KEY,
//         },
//       }
//     );
//     res.json(resp.data);
//   } catch (err) {
//     console.error("Error fetching KYC status:", err?.response?.data || err);
//     res.status(err.response?.status || 500).json({
//       message: "Failed to fetch KYC status",
//       details: err.response?.data,
//     });
//   }
// });