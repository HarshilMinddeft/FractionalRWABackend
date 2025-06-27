const properties = require("../models/propertyModel.js");
const userData = require('../models/UserModel.js')
const { uploadFileToIPFS, uploadJSONToIPFS } = require("../utils/ipfsUploader.js");
const path = require("path");
const { ethers } = require("ethers");
const axios = require("axios");

class Controller {

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
}}

class userController {

  async addUser(req, res) {
    try {
        const {userId, refId, userWalletAddress, kycActive } = req.body;

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

  } else {
    console.log(`KYC status update for ${refId}: ${status}`);
  }
  res.status(200).send("Webhook received");
};

}

module.exports = new userController();
module.exports = new Controller();



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