const Petition = require("../models/Petition");
const Signature = require("../models/Signature");

// =========================================================
// CREATE PETITION
// =========================================================

const createPetition = async (req, res) => {
  try {
    console.log("=================================");
    console.log("CREATE PETITION REQUEST");
    console.log("User:", req.user ? req.user.id : "NO USER");
    console.log("Body:", req.body);
    console.log("=================================");

    // Make sure authentication middleware worked
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required. Please login again.",
      });
    }

    const { title, description, category, location, signatureLimit } = req.body;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (
      !title ||
      !String(title).trim() ||
      !description ||
      !String(description).trim() ||
      !category ||
      !String(category).trim() ||
      !location ||
      !String(location).trim()
    ) {
      return res.status(400).json({
        message: "Title, description, category and location are required",
      });
    }

    // -----------------------------------------------------
    // SIGNATURE LIMIT
    // -----------------------------------------------------

    let parsedSignatureLimit = 100;

    if (
      signatureLimit !== undefined &&
      signatureLimit !== null &&
      signatureLimit !== ""
    ) {
      parsedSignatureLimit = Number(signatureLimit);

      if (
        !Number.isInteger(parsedSignatureLimit) ||
        parsedSignatureLimit <= 0
      ) {
        return res.status(400).json({
          message: "Signature limit must be a positive number",
        });
      }
    }

    // -----------------------------------------------------
    // CREATE PETITION
    // -----------------------------------------------------

    const petition = await Petition.create({
      title: String(title).trim(),
      description: String(description).trim(),
      category: String(category).trim(),
      location: String(location).trim(),

      creator_id: req.user.id,

      status: "active",

      signatureLimit: parsedSignatureLimit,
    });

    console.log("Petition created successfully:", petition.id);

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(201).json({
      message: "Petition created successfully",

      petition: {
        id: petition.id,
        creator_id: petition.creator_id,
        title: petition.title,
        description: petition.description,
        category: petition.category,
        location: petition.location,
        status: petition.status,
        signatureLimit: petition.signatureLimit,
      },
    });
  } catch (error) {
    console.error("CREATE PETITION ERROR:", error);

    return res.status(500).json({
      message: "Failed to create petition",
      error: error.message,
    });
  }
};

// =========================================================
// GET PETITIONS
// =========================================================

const getPetitions = async (req, res) => {
  try {
    const { location, category, status } = req.query;

    const filter = {};

    if (location) {
      filter.location = {
        $regex: String(location).trim(),
        $options: "i",
      };
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    const petitions = await Petition.find(filter).sort({ id: -1 }).lean();

    const petitionIds = petitions.map((petition) => petition.id);

    let signatureCounts = [];

    if (petitionIds.length > 0) {
      signatureCounts = await Signature.aggregate([
        {
          $match: {
            petition_id: {
              $in: petitionIds,
            },
          },
        },

        {
          $group: {
            _id: "$petition_id",
            count: {
              $sum: 1,
            },
          },
        },
      ]);
    }

    const countMap = new Map();

    signatureCounts.forEach((item) => {
      countMap.set(item._id, item.count);
    });

    const petitionsWithCounts = petitions.map((petition) => ({
      ...petition,

      signatureCount: countMap.get(petition.id) || 0,
    }));

    return res.status(200).json(petitionsWithCounts);
  } catch (error) {
    console.error("Get petitions error:", error);

    return res.status(500).json({
      message: "Failed to fetch petitions",
      error: error.message,
    });
  }
};

// =========================================================
// GET SINGLE PETITION
// =========================================================

const getPetitionById = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID",
      });
    }

    const petition = await Petition.findOne({
      id: petitionId,
    });

    if (!petition) {
      return res.status(404).json({
        message: "Petition not found",
      });
    }

    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId,
    });

    return res.status(200).json({
      ...petition.toObject(),

      signatureCount,
    });
  } catch (error) {
    console.error("Get petition error:", error);

    return res.status(500).json({
      message: "Failed to fetch petition",
      error: error.message,
    });
  }
};

// =========================================================
// UPDATE PETITION
// =========================================================

const updatePetition = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID",
      });
    }

    const petition = await Petition.findOne({
      id: petitionId,
    });

    if (!petition) {
      return res.status(404).json({
        message: "Petition not found",
      });
    }

    if (petition.creator_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only update your own petitions",
      });
    }

    // Signed petitions should not be edited
    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId,
    });

    if (signatureCount > 0) {
      return res.status(409).json({
        message: "Signed petitions cannot be edited",
      });
    }

    const { title, description, category, location, signatureLimit } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          message: "Title cannot be empty",
        });
      }

      petition.title = String(title).trim();
    }

    if (description !== undefined) {
      if (!String(description).trim()) {
        return res.status(400).json({
          message: "Description cannot be empty",
        });
      }

      petition.description = String(description).trim();
    }

    if (category !== undefined) {
      petition.category = String(category).trim();
    }

    if (location !== undefined) {
      petition.location = String(location).trim();
    }

    if (signatureLimit !== undefined && signatureLimit !== null) {
      const limit = Number(signatureLimit);

      if (!Number.isInteger(limit) || limit <= 0) {
        return res.status(400).json({
          message: "Signature limit must be a positive number",
        });
      }

      petition.signatureLimit = limit;
    }

    await petition.save();

    return res.status(200).json({
      message: "Petition updated successfully",

      petition,
    });
  } catch (error) {
    console.error("Update petition error:", error);

    return res.status(500).json({
      message: "Failed to update petition",

      error: error.message,
    });
  }
};

// =========================================================
// SIGN PETITION
// =========================================================

const signPetition = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID",
      });
    }

    const petition = await Petition.findOne({
      id: petitionId,
    });

    if (!petition) {
      return res.status(404).json({
        message: "Petition not found",
      });
    }

    if (petition.status !== "active") {
      return res.status(400).json({
        message: "Only active petitions can be signed",
      });
    }

    const existingSignature = await Signature.findOne({
      petition_id: petitionId,

      user_id: req.user.id,
    });

    if (existingSignature) {
      return res.status(409).json({
        message: "You have already signed this petition",
      });
    }

    const signature = await Signature.create({
      petition_id: petitionId,

      user_id: req.user.id,
    });

    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId,
    });

    return res.status(201).json({
      message: "Petition signed successfully",

      signature,

      signatureCount,
    });
  } catch (error) {
    console.error("Sign petition error:", error);

    return res.status(500).json({
      message: "Failed to sign petition",

      error: error.message,
    });
  }
};

// =========================================================
// UNSIGN PETITION
// =========================================================

const unsignPetition = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID",
      });
    }

    const signature = await Signature.findOne({
      petition_id: petitionId,

      user_id: req.user.id,
    });

    if (!signature) {
      return res.status(404).json({
        message: "You have not signed this petition",
      });
    }

    await signature.deleteOne();

    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId,
    });

    return res.status(200).json({
      message: "Signature removed successfully",

      signatureCount,
    });
  } catch (error) {
    console.error("Unsign petition error:", error);

    return res.status(500).json({
      message: "Failed to remove signature",

      error: error.message,
    });
  }
};

// =========================================================
// CHECK SIGNATURE
// =========================================================

const checkSignature = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID",
      });
    }

    const signature = await Signature.findOne({
      petition_id: petitionId,

      user_id: req.user.id,
    });

    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId,
    });

    return res.status(200).json({
      signed: !!signature,

      signatureCount,
    });
  } catch (error) {
    console.error("Check signature error:", error);

    return res.status(500).json({
      message: "Failed to check signature",

      error: error.message,
    });
  }
};

// =========================================================
// DELETE PETITION
// =========================================================

const deletePetition = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID",
      });
    }

    const petition = await Petition.findOne({
      id: petitionId,
    });

    if (!petition) {
      return res.status(404).json({
        message: "Petition not found",
      });
    }

    if (petition.creator_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only delete your own petitions",
      });
    }

    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId,
    });

    if (signatureCount > 0) {
      return res.status(409).json({
        message: "Signed petitions cannot be deleted",
      });
    }

    await petition.deleteOne();

    return res.status(200).json({
      message: "Petition deleted successfully",
    });
  } catch (error) {
    console.error("Delete petition error:", error);

    return res.status(500).json({
      message: "Failed to delete petition",

      error: error.message,
    });
  }
};

module.exports = {
  createPetition,

  getPetitions,

  getPetitionById,

  updatePetition,

  signPetition,

  unsignPetition,

  checkSignature,

  deletePetition,
};
