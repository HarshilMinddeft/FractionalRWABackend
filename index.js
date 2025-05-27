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

const URL =
  "mongodb+srv://harshil:harshil8888@cluster0.nguunro.mongodb.net/Property?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(URL)
  .then(() => {
    console.log("db connected ",`listening on port ${port}`);
    app.listen(port);
  })
  .catch((error) => console.log(error));

  app.use("/api", routes);