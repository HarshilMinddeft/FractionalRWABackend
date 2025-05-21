const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function uploadFileToIPFS(filePath, originalName) {
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));
  data.append("pinataOptions", '{"cidVersion": 0}');
  data.append("pinataMetadata", `{"name": "${originalName}"}`);

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    data,
    {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        ...data.getHeaders(),
      },
    }
  );
  if (!fs.existsSync(filePath)) {
  throw new Error(`File not found: ${filePath}`);
}

  return {
    IpfsHash: response.data.IpfsHash,
    PinSize: response.data.PinSize,
    Timestamp: response.data.Timestamp,
    url: `https://brown-leading-scallop-142.mypinata.cloud/ipfs/${response.data.IpfsHash}`,
  };
}

async function uploadJSONToIPFS(jsonData) {
  const data = new FormData();
  data.append("file", Buffer.from(JSON.stringify(jsonData)), {
    filename: "metadata.json",
    contentType: "application/json",
  });

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    data,
    {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        ...data.getHeaders(),
      },
    }
  );

  return {
    IpfsHash: response.data.IpfsHash,
    url: `https://brown-leading-scallop-142.mypinata.cloud/ipfs/${response.data.IpfsHash}`,
  };
}

module.exports = { uploadFileToIPFS, uploadJSONToIPFS };
