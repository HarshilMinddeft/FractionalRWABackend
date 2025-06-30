const userData = require('../models/UserModel.js')

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