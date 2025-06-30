const express = require("express");
const Controller = require("./Controllers")
// const userController = require("./Controllers")
const router = express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

/* User Router */

router.post('/Properties/nftUpload', upload.single("file"), Controller.nftUpload);
router.post('/Properties/metadataUpload',Controller.uploadMetadata)
router.post('/Properties/addProperty',Controller.addProperty)
router.get('/Properties/getOwnerProperty',Controller.getPropertiesByOwner)
router.get('/Properties/marketPlace/getAllPropertiesSummary',Controller.getAllPropertiesSummary)
router.get('/Properties/marketPlace/getPropertyById/:id',Controller.getPropertyById)

module.exports = router;