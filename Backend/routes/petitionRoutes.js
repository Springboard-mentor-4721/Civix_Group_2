const express = require("express");

const {
  createPetition,
  getPetitions,
  getPetitionById,
  updatePetition,
  signPetition,
  unsignPetition,
  checkSignature
} = require("../controllers/petitionController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


/*
 * Create petition
 */
router.post(
  "/",
  authMiddleware,
  createPetition
);


/*
 * Get all petitions
 * Optional filters:
 * ?location=
 * ?category=
 * ?status=
 */
router.get(
  "/",
  authMiddleware,
  getPetitions
);


/*
 * Get single petition
 */
router.get(
  "/:id",
  authMiddleware,
  getPetitionById
);


/*
 * Edit petition
 */
router.put(
  "/:id",
  authMiddleware,
  updatePetition
);


/*
 * Sign petition
 */
router.post(
  "/:id/sign",
  authMiddleware,
  signPetition
);


/*
 * Remove signature
 */
router.delete(
  "/:id/sign",
  authMiddleware,
  unsignPetition
);


/*
 * Check current user's signature
 */
router.get(
  "/:id/sign",
  authMiddleware,
  checkSignature
);


module.exports = router;