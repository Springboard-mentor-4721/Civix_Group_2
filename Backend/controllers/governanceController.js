const Petition = require("../models/Petition");
const GovernanceResponse = require("../models/GovernanceResponse");
const AdminLog = require("../models/AdminLog");

function parsePetitionId(value) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0
    ? id
    : null;
}


/*
=========================================================
GET PETITIONS FOR OFFICIAL'S LOCALITY
=========================================================
*/

const getLocalPetitions = async (req, res) => {
  try {
    const officialLocation = req.user.location;

    if (!officialLocation || !String(officialLocation).trim()) {
      return res.status(400).json({
        message: "Official location is not configured"
      });
    }

    const location = String(officialLocation).trim();

    const petitions = await Petition.find({
      location: {
        $regex: location,
        $options: "i"
      }
    })
      .sort({ id: -1 })
      .lean();

    const petitionIds = petitions.map(
      (petition) => petition.id
    );

    const responses = petitionIds.length
      ? await GovernanceResponse.find({
          petition_id: {
            $in: petitionIds
          }
        })
          .sort({ createdAt: -1 })
          .lean()
      : [];

    const responseMap = new Map();

    responses.forEach((response) => {
      if (!responseMap.has(response.petition_id)) {
        responseMap.set(
          response.petition_id,
          response
        );
      }
    });

    const result = petitions.map((petition) => ({
      ...petition,

      latestResponse:
        responseMap.get(petition.id) || null
    }));

    return res.status(200).json({
      count: result.length,
      location,
      petitions: result
    });
  } catch (error) {
    console.error(
      "Get local petitions error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch local petitions"
    });
  }
};


/*
=========================================================
GET PETITION FOR OFFICIAL
=========================================================
*/

const getGovernancePetition = async (req, res) => {
  try {
    const petitionId = parsePetitionId(
      req.params.id
    );

    if (!petitionId) {
      return res.status(400).json({
        message: "Invalid petition ID"
      });
    }

    const petition = await Petition.findOne({
      id: petitionId
    }).lean();

    if (!petition) {
      return res.status(404).json({
        message: "Petition not found"
      });
    }

    const officialLocation =
      String(req.user.location || "")
        .trim()
        .toLowerCase();

    const petitionLocation =
      String(petition.location || "")
        .trim()
        .toLowerCase();

    if (
      !officialLocation ||
      !petitionLocation.includes(officialLocation)
    ) {
      return res.status(403).json({
        message:
          "You can only access petitions from your locality"
      });
    }

    const responses =
      await GovernanceResponse.find({
        petition_id: petitionId
      })
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json({
      petition,
      responses
    });
  } catch (error) {
    console.error(
      "Get governance petition error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch petition"
    });
  }
};


/*
=========================================================
OFFICIAL RESPONDS TO PETITION
=========================================================
*/

const respondToPetition = async (req, res) => {
  try {
    const petitionId = parsePetitionId(
      req.params.id
    );

    if (!petitionId) {
      return res.status(400).json({
        message: "Invalid petition ID"
      });
    }

    const {
      comment,
      status
    } = req.body;

    if (
      typeof comment !== "string" ||
      !comment.trim()
    ) {
      return res.status(400).json({
        message: "Comment is required"
      });
    }

    const allowedStatuses = [
      "active",
      "under_review",
      "closed"
    ];

    if (
      !status ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message:
          "Status must be active, under_review, or closed"
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

    /*
     * Officials can only respond to petitions
     * in their own locality.
     */

    const officialLocation =
      String(req.user.location || "")
        .trim()
        .toLowerCase();

    const petitionLocation =
      String(petition.location || "")
        .trim()
        .toLowerCase();

    if (
      !officialLocation ||
      !petitionLocation.includes(officialLocation)
    ) {
      return res.status(403).json({
        message:
          "You can only respond to petitions from your locality"
      });
    }

    /*
     * Update petition status
     */

    petition.status = status;

    await petition.save();

    /*
     * Store official response
     */

    const response =
      await GovernanceResponse.create({
        petition_id: petitionId,
        official_id: req.user.id,
        comment: comment.trim(),
        status
      });

    /*
     * Store audit log
     */

    await AdminLog.create({
      action:
        `Official responded to petition ${petitionId} with status ${status}`,
      user_id: req.user.id,
      petition_id: petitionId
    });

    return res.status(201).json({
      message:
        "Governance response submitted successfully",

      petition: {
        id: petition.id,
        status: petition.status
      },

      response
    });
  } catch (error) {
    console.error(
      "Respond to petition error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to submit governance response"
    });
  }
};


/*
=========================================================
GET RESPONSE HISTORY
=========================================================
*/

const getResponseHistory = async (req, res) => {
  try {
    const petitionId = parsePetitionId(
      req.params.id
    );

    if (!petitionId) {
      return res.status(400).json({
        message: "Invalid petition ID"
      });
    }

    const petition = await Petition.findOne({
      id: petitionId
    }).lean();

    if (!petition) {
      return res.status(404).json({
        message: "Petition not found"
      });
    }

    const responses =
      await GovernanceResponse.find({
        petition_id: petitionId
      })
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json({
      petitionId,
      count: responses.length,
      responses
    });
  } catch (error) {
    console.error(
      "Response history error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch response history"
    });
  }
};


module.exports = {
  getLocalPetitions,
  getGovernancePetition,
  respondToPetition,
  getResponseHistory
};