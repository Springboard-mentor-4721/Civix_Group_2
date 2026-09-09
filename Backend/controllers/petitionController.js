const Petition = require("../models/Petition");
const Signature = require("../models/Signature");


/*
 * CREATE PETITION
 */
const createPetition = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location
    } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        message:
          "Title, description, category and location are required"
      });
    }

    const petition = new Petition({
      creator_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      status: "active"
    });

    await petition.save();

    return res.status(201).json({
      message: "Petition created successfully",
      petition
    });

  } catch (error) {
    console.error(
      "Create petition error:",
      error
    );

    return res.status(500).json({
      message: "Server error while creating petition"
    });
  }
};


/*
 * GET ALL PETITIONS
 * Supports:
 * location
 * category
 * status
 */
const getPetitions = async (req, res) => {
  try {
    const {
      location,
      category,
      status
    } = req.query;

    const filter = {};

    if (location) {
      filter.location = {
        $regex: location.trim(),
        $options: "i"
      };
    }

    if (category) {
      filter.category = {
        $regex: category.trim(),
        $options: "i"
      };
    }

    if (status) {
      const validStatuses = [
        "active",
        "under_review",
        "closed"
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Status must be active, under_review or closed"
        });
      }

      filter.status = status;
    }

    const petitions = await Petition.find(filter)
      .sort({ id: -1 });

    return res.status(200).json({
      count: petitions.length,
      petitions
    });

  } catch (error) {
    console.error(
      "Get petitions error:",
      error
    );

    return res.status(500).json({
      message: "Server error while fetching petitions"
    });
  }
};


/*
 * GET SINGLE PETITION
 */
const getPetitionById = async (req, res) => {
  try {
    const petitionId = Number(req.params.id);

    if (!Number.isInteger(petitionId)) {
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
      petition,
      signatureCount
    });

  } catch (error) {
    console.error(
      "Get petition error:",
      error
    );

    return res.status(500).json({
      message: "Server error while fetching petition"
    });
  }
};


/*
 * EDIT PETITION
 */
const updatePetition = async (req, res) => {
  try {
    const petitionId = Number(req.params.id);

    if (!Number.isInteger(petitionId)) {
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

    if (petition.creator_id !== req.user.id) {
      return res.status(403).json({
        message:
          "You are not authorized to edit this petition"
      });
    }

    const {
      title,
      description,
      category,
      location,
      status
    } = req.body;

    if (
      title === undefined &&
      description === undefined &&
      category === undefined &&
      location === undefined &&
      status === undefined
    ) {
      return res.status(400).json({
        message: "No fields provided for update"
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          message: "Title cannot be empty"
        });
      }

      petition.title = title.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({
          message: "Description cannot be empty"
        });
      }

      petition.description = description.trim();
    }

    if (category !== undefined) {
      if (!category.trim()) {
        return res.status(400).json({
          message: "Category cannot be empty"
        });
      }

      petition.category = category.trim();
    }

    if (location !== undefined) {
      if (!location.trim()) {
        return res.status(400).json({
          message: "Location cannot be empty"
        });
      }

      petition.location = location.trim();
    }

    if (status !== undefined) {
      const validStatuses = [
        "active",
        "under_review",
        "closed"
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Status must be active, under_review or closed"
        });
      }

      petition.status = status;
    }

    await petition.save();

    return res.status(200).json({
      message: "Petition updated successfully",
      petition
    });

  } catch (error) {
    console.error(
      "Update petition error:",
      error
    );

    return res.status(500).json({
      message: "Server error while updating petition"
    });
  }
};


/*
 * SIGN PETITION
 */
const signPetition = async (req, res) => {
  try {
    const petitionId = Number(req.params.id);

    if (!Number.isInteger(petitionId)) {
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
        message:
          "Only active petitions can be signed"
      });
    }

    const existingSignature =
      await Signature.findOne({
        petition_id: petitionId,
        user_id: req.user.id
      });

    if (existingSignature) {
      return res.status(409).json({
        message: "You have already signed this petition"
      });
    }

    const signature = new Signature({
      petition_id: petitionId,
      user_id: req.user.id
    });

    await signature.save();

    const signatureCount =
      await Signature.countDocuments({
        petition_id: petitionId
      });

    return res.status(201).json({
      message: "Petition signed successfully",
      signature,
      signatureCount
    });

  } catch (error) {
    console.error(
      "Sign petition error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already signed this petition"
      });
    }

    return res.status(500).json({
      message: "Server error while signing petition"
    });
  }
};


/*
 * UNSIGN PETITION
 */
const unsignPetition = async (req, res) => {
  try {
    const petitionId = Number(req.params.id);

    if (!Number.isInteger(petitionId)) {
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

    const signature =
      await Signature.findOneAndDelete({
        petition_id: petitionId,
        user_id: req.user.id
      });

    if (!signature) {
      return res.status(404).json({
        message: "You have not signed this petition"
      });
    }

    const signatureCount =
      await Signature.countDocuments({
        petition_id: petitionId
      });

    return res.status(200).json({
      message: "Petition signature removed",
      signatureCount
    });

  } catch (error) {
    console.error(
      "Unsign petition error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while removing petition signature"
    });
  }
};


/*
 * CHECK WHETHER CURRENT USER SIGNED
 */
const checkSignature = async (req, res) => {
  try {
    const petitionId = Number(req.params.id);

    if (!Number.isInteger(petitionId)) {
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

    const signature =
      await Signature.findOne({
        petition_id: petitionId,
        user_id: req.user.id
      });

    const signatureCount =
      await Signature.countDocuments({
        petition_id: petitionId
      });

    return res.status(200).json({
      signed: !!signature,
      signatureCount
    });

  } catch (error) {
    console.error(
      "Check signature error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while checking signature"
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
  checkSignature
};