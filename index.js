const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const routes = require('./routes/routes');
const express = require("express");
const controllers = require('./routes/Controllers');

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*", 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
dotenv.config();

const port = 3001;

const URL =
  "mongodb+srv://harshil:harshil8888@cluster0.nguunro.mongodb.net/3643Property?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(URL)
  .then(() => {
    console.log("db connected ",`listening on port ${port}`);
    app.listen(port);
  })
  .catch((error) => console.log(error));

  app.use("/api", routes);

  // New webhook endpoint for Blockpass KYC approval
app.post("/api/blockpass-webhook", async (req, res) => {
  try {
    const { userId, status, recordId } = req.body;
    if (!userId || !status || !recordId) {
      return res.status(400).send("Missing required fields: userId, status, or recordId");
    }
    if (status === "APPROVED") {
      await controllers.deployIdentityAndAddClaim(userId, recordId);
      console.log(`KYC approved for ${userId}. Identity.sol deployed and claim added.`);
    } else {
      console.log(`KYC status for ${userId}: ${status}`);
    }
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Webhook processing failed");
  }
});

module.exports = app;