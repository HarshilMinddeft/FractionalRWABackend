const properties = require("../models/propertyModel.js");
const { uploadFileToIPFS, uploadJSONToIPFS } = require("../utils/ipfsUploader.js");
const path = require("path");
const { ethers } = require("ethers");
const axios = require("axios");
const { Identity } = require("@onchain-id/identity-sdk");

class Controller {
    constructor() {
    // Initialize ethers provider and wallet for Celo Alfajores
    this.provider = new ethers.providers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.claimIssuerAddress = "0x496Cc5B22f83257e4DD59f3a862Dc378107e69fb";
    this.blockpassApiKey = process.env.BLOCKPASS_API_KEY;
    this.blockpassServiceId = process.env.BLOCKPASS_SERVICE_ID;
  }

 async nftUpload(req, res) {
    try {
      const filePath = path.join(__dirname, "../uploads", req.file.filename);
      const result = await uploadFileToIPFS(filePath, req.file.originalname);
      res.status(200).json(result);
    } catch (error) {
      console.error("IPFS Upload Error:", error);
      res.status(500).json({ message: "Failed to upload to IPFS" });
    }
  }

 async uploadMetadata(req, res) {
    try {
      const result = await uploadJSONToIPFS(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("JSON Upload Error:", error);
      res.status(500).json({ message: "Failed to upload JSON to IPFS" });
    }
  }

 async addProperty(req, res) {
    try {
        // Destructure data from the request body
        const {propertyId, propertyName, propertyPrice, propertySize, propertyOwnerWallet, propertyFeatures, offringDetailes, propertyDetailes, propertyManagement ,locationDetailes, propertyDocuments, propertyImages, propertyThumbImages, complianceAddress, active } = req.body;

        // Validate required fields
        if (!propertyId ||!propertyName || !propertyPrice || !propertySize || !propertyOwnerWallet || !propertyFeatures || !offringDetailes || !propertyDetailes || !propertyManagement || !locationDetailes || !propertyDocuments || !propertyImages || !propertyThumbImages || !complianceAddress) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Create a new Property document
        const newStream = new properties({
            propertyId,
            propertyName,
            propertyPrice,
            propertySize,
            propertyOwnerWallet: propertyOwnerWallet.toLowerCase(),
            propertyFeatures,
            offringDetailes,
            propertyDetailes,
            propertyManagement,
            locationDetailes,
            propertyDocuments,
            propertyImages,
            propertyThumbImages,
            complianceAddress,
            active
        });

        // Save the stream to the database
        await newStream.save();
        // Respond with success message
        res.status(201).json({ message: "Stream added successfully.", stream: newStream });
    } catch (error) {
        console.error("Error adding stream:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

async getPropertiesByOwner(req, res) {
  try {
    const { ownerAddress } = req.query;

    if (!ownerAddress) {
      return res.status(400).json({ message: "ownerAddress is required" });
    }

    // Find properties that belong to the specified wallet address
    const ownedProperties = await properties.find({ propertyOwnerWallet: ownerAddress.toLowerCase() });

    res.status(200).json({ properties: ownedProperties });
  } catch (error) {
    console.error("Error fetching properties by owner:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

async getAllPropertiesSummary(req, res) {
  try {
    const propertiesSummary = await properties.find({}, {
      propertyId: 1,
      propertyPrice:1,
      propertyName: 1,
      propertyThumbImages: 1,
      propertySize: 1,
    });

    res.status(200).json({ properties: propertiesSummary });
  } catch (error) {
    console.error("Error fetching properties summary:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
}

async getPropertyById(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Property ID is required" });
    }
    const property = await properties.findOne({ propertyId: id });

    if (!property) {
      return res.status(404).json({ message: "Property not found" , property: null });
    }
    res.status(200).json({ property });
  } catch (error) {
    console.error("Error fetching property by ID:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
async startKYC(req, res) {
  try {
    const { userAddress, email } = req.body;

    if (!userAddress || !email) {
      return res.status(400).json({ message: "userAddress and email are required" });
    }

    const response = await axios.post(
      `https://kyc.blockpass.org/kyc/1.0/connect/${this.blockpassServiceId}/user`,
      {
        userId: userAddress, 
        email,               
        metadata: { address: userAddress }
      },
      {
        headers: {
          Authorization: `Bearer ${this.blockpassApiKey}`
        }
      }
    );

    res.status(200).json({ kycUrl: response.data.data.url });

  } catch (error) {
    console.error("KYC Initiation Error:", error?.response?.data || error.message);
    res.status(500).json({ message: "Failed to initiate KYC" });
  }
}


  // New function: Handle Blockpass KYC approval and deploy Identity.sol
  async deployIdentityAndAddClaim(userAddress, blockpassRecordId) {
    try {
      // Deploy Identity.sol using OnchainID SDK
      const identity = await Identity.deployNew(this.wallet, userAddress);
      const identityAddress = await identity.getAddress();
      console.log(`Identity.sol deployed for ${userAddress} at ${identityAddress}`);

      // Add ClaimIssuer key (purpose 3 = CLAIM_SIGNER, key type 1 = ECDSA)
      await identity.addKey(this.claimIssuerAddress, 3, 1);
      console.log(`ClaimIssuer ${this.claimIssuerAddress} added as CLAIM_SIGNER`);

      // Generate and sign KYC claim (based on your script)
      const topic = 1; // KYC claim topic
      const data = ethers.toUtf8Bytes(`KYC-verified:${blockpassRecordId}`);
      const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes"],
        [identityAddress, topic, data]
      );
      const dataHash = ethers.keccak256(encoded);
      const signature = await this.wallet.signMessage(ethers.getBytes(dataHash));

      // Add claim to Identity.sol
      const scheme = 1; // ECDSA signature scheme
      const uri = ""; // Optional URI
      await identity.addClaim(topic, scheme, this.claimIssuerAddress, signature, data, uri);
      console.log(`KYC claim added for ${userAddress}`);

      // Return identity address for logging or further processing (no MongoDB storage)
      return { identityAddress, status: "KYC claim added" };
    } catch (error) {
      console.error("Identity Deployment Error:", error);
      throw error;
    }
  }
}

module.exports = new Controller();