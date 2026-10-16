const express = require("express");

const {
  getLocationName
} = require("../controllers/locationController");

const router = express.Router();

router.post(
  "/reverse-geocode",
  getLocationName
);

module.exports = router;