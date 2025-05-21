const express = require("express");
const controllers = require("./Controllers")
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

router.post('/Properties/nftUpload', upload.single("file"), controllers.nftUpload);
router.post('/Properties/metadataUpload',controllers.uploadMetadata)
router.post('/Properties/addProperty',controllers.addProperty)
router.get('/Properties/getOwnerProperty',controllers.getPropertiesByOwner)
router.get('/Properties/marketPlace/getAllPropertiesSummary',controllers.getAllPropertiesSummary)
router.get('/Properties/marketPlace/getPropertyById/:id',controllers.getPropertyById)

module.exports = router;