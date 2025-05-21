const properties = require("../../Backend/models/propertyModel.js");
const { uploadFileToIPFS, uploadJSONToIPFS } = require("../../Backend/utils/ipfsUploader.js");
const path = require("path");

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
        const {propertyId, propertyName, propertyPrice, propertySize, propertyOwnerWallet, propertyFeatures, offringDetailes, propertyDetailes, propertyManagement ,locationDetailes, propertyDocuments, propertyImages, propertyThumbImages, active } = req.body;

        // Validate required fields
        if (!propertyId ||!propertyName || !propertyPrice || !propertySize || !propertyOwnerWallet || !propertyFeatures || !offringDetailes || !propertyDetailes || !propertyManagement || !locationDetailes || !propertyDocuments || !propertyImages || !propertyThumbImages) {
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
}

module.exports = new Controller();