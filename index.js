const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const routes = require('./routes/routes');
const userRoutes = require('./routes/userRoutes');
const express = require("express");

const app = express();
dotenv.config();

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

const port = 3001;

const mainDB = "mongodb+srv://harshil:harshil8888@cluster0.nguunro.mongodb.net/3643Property?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(mainDB)
  .then(() => {
    console.log("Connected to main DB");
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((error) => console.log("Main DB connection error:", error));

const secondDB = "mongodb+srv://harshil:harshil8888@cluster0.nguunro.mongodb.net/userData?retryWrites=true&w=majority&appName=Cluster0";
const secondConnection = mongoose.createConnection(secondDB);

const userSchema = require('./models/UserModel').schema;
secondConnection.model('UserModel', userSchema); 

app.use("/api", routes);
app.use("/api", userRoutes);
