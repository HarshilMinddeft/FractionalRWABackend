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
  console.log("🟦 Webhook received:", payload);

  const { status, refId, identities } = payload;
  if (status === "approved") {
    console.log(`✅ KYC approved: ${refId}`, identities);
    // Save to DB, update user status...
  } else {
    console.log(`🔶 KYC status for ${refId}:`, status);
  }

  res.status(200).send("Received");
});

app.listen(3001, () => console.log("Listening on 3001"));
