const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const routes = require('./routes/routes');
const express = require("express");

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

// const URL =
//   "mongodb+srv://harshil:harshil8888@cluster0.nguunro.mongodb.net/3643Property?retryWrites=true&w=majority&appName=Cluster0";

// mongoose
//   .connect(URL)
//   .then(() => {
//     console.log("db connected ",`listening on port ${port}`);
//     app.listen(port);
//   })
//   .catch((error) => console.log(error));

//   app.use("/api", routes);
app.post("/api/blockpass-webhook", (req, res) => {
  const payload = req.body;
  console.log("🟦 Webhook received at", new Date().toISOString());
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("RAW PAYLOAD",payload)

  const { status, refId, identities, metadata } = payload;

  if (status === "approved") {
    console.log(`✅ KYC approved for ${refId}`);
    console.log("Identities:", identities);
    console.log("Metadata:", metadata);


  } else {
    console.log(`ℹ️ KYC status update for ${refId}: ${status}`);
  }

  res.status(200).send("Webhook received");
});


app.listen(3001, () => console.log("Listening on 3001"));
