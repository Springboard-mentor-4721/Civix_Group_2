const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { reverseGeocode } = require("../utils/geolocation");

/*
 * REGISTER USER
 * Supports both citizen and official roles.
 *
 * Location is optional.
 * If latitude and longitude are provided,
 * reverse geocoding is used to determine a
 * readable location such as:
 * "Solapur, Maharashtra, India"
 */
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      location,
      latitude,
      longitude
    } = req.body;

    // -----------------------------
    // Basic validation
    // -----------------------------

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required"
      });
    }

    // Validate role
    if (!["citizen", "official"].includes(role)) {
      return res.status(400).json({
        message: "Role must be citizen or official"
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address"
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long"
      });
    }

    // -----------------------------
    // Validate coordinates
    // -----------------------------

    let validLatitude;
    let validLongitude;

    if (latitude !== undefined || longitude !== undefined) {
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          message: "Both latitude and longitude are required"
        });
      }

      validLatitude = Number(latitude);
      validLongitude = Number(longitude);

      if (
        !Number.isFinite(validLatitude) ||
        !Number.isFinite(validLongitude)
      ) {
        return res.status(400).json({
          message: "Latitude and longitude must be valid numbers"
        });
      }

      if (validLatitude < -90 || validLatitude > 90) {
        return res.status(400).json({
          message: "Invalid latitude"
        });
      }

      if (validLongitude < -180 || validLongitude > 180) {
        return res.status(400).json({
          message: "Invalid longitude"
        });
      }
    }

    // -----------------------------
    // Check duplicate email
    // -----------------------------

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    // -----------------------------
    // Password hashing
    // -----------------------------

    const hashedPassword = await bcrypt.hash(password, 12);

    // -----------------------------
    // Location detection
    // -----------------------------

    let detectedLocation = location
      ? String(location).trim()
      : undefined;

    /*
     * If GPS coordinates are provided,
     * try to convert them into a readable
     * location name.
     *
     * Example:
     * 17.6599, 75.9064
     * →
     * Solapur, Maharashtra, India
     */

    if (
      validLatitude !== undefined &&
      validLongitude !== undefined
    ) {
      try {
        const geoResult = await reverseGeocode(
          validLatitude,
          validLongitude
        );

        if (geoResult.location) {
          detectedLocation = geoResult.location;
        }
      } catch (error) {
        console.error(
          "Reverse geocoding failed:",
          error.message
        );

        /*
         * Location detection failure should NOT
         * prevent registration.
         *
         * If the frontend supplied a location,
         * keep that value.
         */
      }
    }

    // -----------------------------
    // Create user
    // -----------------------------

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      location: detectedLocation,
      latitude: validLatitude,
      longitude: validLongitude
    });

    await user.save();

    // -----------------------------
    // Response
    // -----------------------------

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude
      }
    });

  } catch (error) {
    console.error("Registration error:", error);

    // Handle MongoDB duplicate email error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    return res.status(500).json({
      message: "Server error during registration"
    });
  }
};


/*
 * LOGIN USER
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // -----------------------------
    // Find user
    //
    // Password has select:false in User.js,
    // therefore explicitly select it here.
    // -----------------------------

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // -----------------------------
    // Compare password
    // -----------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // -----------------------------
    // Generate JWT
    // -----------------------------

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
      }
    );

    // -----------------------------
    // Response
    // -----------------------------

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error during login"
    });
  }
};


module.exports = {
  register,
  login
};