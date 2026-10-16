const { reverseGeocode } = require("../utils/geolocation");

const getLocationName = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Check if coordinates are provided
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Latitude and longitude are required"
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    // Validate numbers
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({
        message: "Latitude and longitude must be valid numbers"
      });
    }

    // Validate latitude range
    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        message: "Invalid latitude"
      });
    }

    // Validate longitude range
    if (lon < -180 || lon > 180) {
      return res.status(400).json({
        message: "Invalid longitude"
      });
    }

    // Reverse geocode
    const result = await reverseGeocode(lat, lon);

    if (!result.location) {
      return res.status(404).json({
        message: "Unable to determine location"
      });
    }

    return res.status(200).json({
      location: result.location,
      latitude: lat,
      longitude: lon
    });

  } catch (error) {
    console.error("Location detection error:", error.message);

    return res.status(500).json({
      message: "Unable to detect location"
    });
  }
};

module.exports = {
  getLocationName
};