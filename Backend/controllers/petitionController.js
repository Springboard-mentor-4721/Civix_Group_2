const Petition = require("../models/Petition");
const Signature = require("../models/Signature");

// Create petition
const createPetition = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        message: "Title, description, category and location are required"
      });
    }

    const petition = await Petition.create({
      title,
      description,
      category,
      location,
      creator_id: req.user.id,
      status: "active"
    });

    return res.status(201).json({
      message: "Petition created successfully",
      petition
    });
  } catch (error) {
    console.error("Create petition error:", error);

    return res.status(500).json({
      message: "Failed to create petition",
      error: error.message
    });
  }
};

// Get petitions
const getPetitions = async (req, res) => {
  try {
    const { location, category, status } = req.query;

    const filter = {};

    if (location) {
      filter.location = {
        $regex: location,
        $options: "i"
      };
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    const petitions = await Petition.find(filter).sort({ id: -1 });

    const petitionsWithCounts = await Promise.all(
      petitions.map(async (petition) => {
        const signatureCount = await Signature.countDocuments({
          petition_id: petition.id
        });

        return {
          ...petition.toObject(),
          signatureCount
        };
      })
    );

    return res.status(200).json(petitionsWithCounts);
  } catch (error) {
    console.error("Get petitions error:", error);

    return res.status(500).json({
      message: "Failed to fetch petitions",
      error: error.message
    });
  }
};

// Get single petition
const getPetitionById = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID"
      });
    }

    const petition = await Petition.findOne({
      id: petitionId
    });

    if (!petition) {
      return res.status(404).json({
        message: "Petition not found"
      });
    }

    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId
    });

    return res.status(200).json({
      ...petition.toObject(),
      signatureCount
    });
  } catch (error) {
    console.error("Get petition error:", error);

    return res.status(500).json({
      message: "Failed to fetch petition",
      error: error.message
    });
  }
};

// Update petition
const updatePetition = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID"
      });
    }

    const petition = await Petition.findOne({
      id: petitionId
    });

    if (!petition) {
      return res.status(404).json({
        message: "Petition not found"
      });
    }

    // Only the creator can update the petition
    if (petition.creator_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only update your own petitions"
      });
    }

    const { title, description, category, location } = req.body;

    if (title !== undefined) {
      petition.title = title;
    }

    if (description !== undefined) {
      petition.description = description;
    }

    if (category !== undefined) {
      petition.category = category;
    }

    if (location !== undefined) {
      petition.location = location;
    }

    await petition.save();

    return res.status(200).json({
      message: "Petition updated successfully",
      petition
    });
  } catch (error) {
    console.error("Update petition error:", error);

    return res.status(500).json({
      message: "Failed to update petition",
      error: error.message
    });
  }
};

// Sign petition
const signPetition = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID"
      });
    }

    const petition = await Petition.findOne({
      id: petitionId
    });

    if (!petition) {
      return res.status(404).json({
        message: "Petition not found"
      });
    }

    if (petition.status !== "active") {
      return res.status(400).json({
        message: "Only active petitions can be signed"
      });
    }

    const existingSignature = await Signature.findOne({
      petition_id: petitionId,
      user_id: req.user.id
    });

    if (existingSignature) {
      return res.status(409).json({
        message: "You have already signed this petition"
      });
    }

    const signature = await Signature.create({
      petition_id: petitionId,
      user_id: req.user.id
    });

    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId
    });

    return res.status(201).json({
      message: "Petition signed successfully",
      signature,
      signatureCount
    });
  } catch (error) {
    console.error("Sign petition error:", error);

    return res.status(500).json({
      message: "Failed to sign petition",
      error: error.message
    });
  }
};

// Unsign petition
const unsignPetition = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID"
      });
    }

    const signature = await Signature.findOne({
      petition_id: petitionId,
      user_id: req.user.id
    });

    if (!signature) {
      return res.status(404).json({
        message: "You have not signed this petition"
      });
    }

    await signature.deleteOne();

    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId
    });

    return res.status(200).json({
      message: "Signature removed successfully",
      signatureCount
    });
  } catch (error) {
    console.error("Unsign petition error:", error);

    return res.status(500).json({
      message: "Failed to remove signature",
      error: error.message
    });
  }
};

// Check signature
const checkSignature = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID"
      });
    }

    const signature = await Signature.findOne({
      petition_id: petitionId,
      user_id: req.user.id
    });

    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId
    });

    return res.status(200).json({
      signed: !!signature,
      signatureCount
    });
  } catch (error) {
    console.error("Check signature error:", error);

    return res.status(500).json({
      message: "Failed to check signature",
      error: error.message
    });
  }
};

// Delete petition
const deletePetition = async (req, res) => {
  try {
    const petitionId = parseInt(req.params.id);

    if (isNaN(petitionId)) {
      return res.status(400).json({
        message: "Invalid petition ID"
      });
    }

    const petition = await Petition.findOne({
      id: petitionId
    });

    if (!petition) {
      return res.status(404).json({
        message: "Petition not found"
      });
    }

    // Only the creator can delete the petition
    if (petition.creator_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only delete your own petitions"
      });
    }

    // Check whether anyone has signed the petition
    const signatureCount = await Signature.countDocuments({
      petition_id: petitionId
    });

    // Once signed, the petition can NEVER be deleted
    if (signatureCount > 0) {
      return res.status(409).json({
        message: "Signed petitions cannot be deleted"
      });
    }

    await petition.deleteOne();

    return res.status(200).json({
      message: "Petition deleted successfully"
    });
  } catch (error) {
    console.error("Delete petition error:", error);

    return res.status(500).json({
      message: "Failed to delete petition",
      error: error.message
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
  deletePetition
};