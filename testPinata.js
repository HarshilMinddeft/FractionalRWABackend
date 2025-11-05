const axios = require("axios");
require("dotenv").config();

async function testPinataAuth() {
  try {
    // Test authentication by listing pins
    const response = await axios.get(
      "https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=1",
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    console.log("✓ Pinata JWT is valid!");
    console.log("Response:", response.data);

    // Test file pinning permissions
    const FormData = require("form-data");
    const fs = require("fs");

    // Create a small test file
    const testContent = "Test file for Pinata upload";
    fs.writeFileSync("/tmp/test-pinata.txt", testContent);

    const data = new FormData();
    data.append("file", fs.createReadStream("/tmp/test-pinata.txt"));
    data.append("pinataMetadata", '{"name": "test-upload"}');

    const uploadResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...data.getHeaders(),
        },
      }
    );

    console.log("✓ File pinning works!");
    console.log("IPFS Hash:", uploadResponse.data.IpfsHash);

    // Clean up
    fs.unlinkSync("/tmp/test-pinata.txt");

  } catch (error) {
    console.error("✗ Pinata authentication failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error:", error.response.data);

      if (error.response.status === 403) {
        console.error("\n🔴 403 Forbidden - Your JWT token is either:");
        console.error("   1. Expired");
        console.error("   2. Missing required permissions (pinFileToIPFS)");
        console.error("   3. Invalid");
        console.error("\n💡 Solution: Generate a new API key in Pinata dashboard");
        console.error("   https://app.pinata.cloud/keys");
      }
    } else {
      console.error("Error:", error.message);
    }
  }
}

testPinataAuth();
