const express = require("express");

const {
  createPetition,
  getPetitions,
  getPetitionById,
  updatePetition,
  signPetition,
  unsignPetition,
  checkSignature,
  deletePetition,
} = require("../controllers/petitionController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a petition
router.post("/", authMiddleware, createPetition);

// Get all petitions
router.get("/", authMiddleware, getPetitions);

// Get a single petition
router.get("/:id", authMiddleware, getPetitionById);

// Update a petition
router.put("/:id", authMiddleware, updatePetition);

// Sign a petition
router.post("/:id/sign", authMiddleware, signPetition);

// Remove user's signature
router.delete("/:id/sign", authMiddleware, unsignPetition);

// Check signature status
router.get("/:id/sign", authMiddleware, checkSignature);

// Delete petition
router.delete("/:id", authMiddleware, deletePetition);

module.exports = router;
