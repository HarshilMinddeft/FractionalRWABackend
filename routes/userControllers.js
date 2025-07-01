const userData = require('../models/UserModel.js')
const identityStorageArti = require('../artifacts/contracts/RwaERC-3643/registry/implementation/IdentityRegistryStorage.sol/IdentityRegistryStorage.json')
const IdentityArti = require('../artifacts/contracts/onchainId/Identity.json')
const claimIssuer = require('../artifacts/contracts/onchainId/ClaimIssuer.json')
const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
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

  const { status, refId } = payload;

  res.status(200).send("Webhook received");

  if (status === "approved") {
    console.log(`KYC approved for ${refId}`);

     try {
      const user = await userData.findOne({ refId });

      if (!user) {
        console.log("User not found for refId:", refId);
        return res.status(404).json({ message: "User not found." });
      }

      const userWallet = user.userWalletAddress;
      console.log("Deploying Identity.sol for wallet:", userWallet);


// Deploy Identity.sol
      const identityFactory = new ethers.ContractFactory(
        IdentityArti.abi,
        IdentityArti.bytecode,
        deployer
      );

      const identity = await identityFactory.deploy(deployer.address,false);
      await identity.waitForDeployment();

      const identityAddress = await identity.getAddress();
      console.log("✅ Identity.sol deployed at:", identityAddress);

// Generate Signature and data for addingClaim
      const topic = 1;
      const data = ethers.toUtf8Bytes("KYC-verified");
      const claimIssureCA = "0x496Cc5B22f83257e4DD59f3a862Dc378107e69fb"
      const uri = `Kyc-BlockPass-${refId}`

      const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes"],
        [identityAddress, topic, data]
      );

      const dataHash = ethers.keccak256(encoded); // hash to sign
      const signature = await deployer.signMessage(ethers.getBytes(dataHash));
      const Data = ethers.hexlify(data)

      console.log("Signature:", signature);
      console.log("Issuer Address (should be added as key with purpose 3):", deployer.address);
      console.log("Data (hex):",Data);

// AddClaim in identity.sol

      const AddClaimIdentity = new ethers.Contract(
        identityAddress,
        IdentityArti.abi,
        deployer
      );
      
      const addKycClaim = await AddClaimIdentity.addClaim(
        topic,
        1,
        claimIssureCA,
        signature,
        Data,
        uri
      );
      const receipt = await addKycClaim.wait();
      console.log("Claim Addes Transaction confirmed in block:", receipt.blockNumber);

// // Add identity.sol and userAddress to registry contract 

      const registryStoregeCA = "0x4D5F47A18ec98EB605bd2aB99e43A2786Acc26FC"

      const registryStorage = new ethers.Contract(
        registryStoregeCA,
        identityStorageArti.abi,
        deployer
      );

      const addIdentity = await registryStorage.addIdentityToStorage(
        userWallet,
        identityAddress,
        1
      )
      const AddIdentityreceipt = await addIdentity.wait();
      console.log("IdentityAddedToIdentityStorage", AddIdentityreceipt.hash);

      console.log("Kyc process is completed successfully")

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