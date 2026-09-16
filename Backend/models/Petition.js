const mongoose = require("mongoose");
const Counter = require("./Counter");

const petitionSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },

    creator_id: {
      type: Number,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
      index: true,
    },

    location: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["active", "under_review", "closed"],
      default: "active",
      index: true,
    },

    /*
     * Maximum number of signatures targeted
     * by the petition creator.
     */
    signatureLimit: {
      type: Number,
      default: 100,
      min: 1,
    },
  },

  {
    timestamps: false,
  },
);

/* =========================================================
   AUTO-INCREMENT PETITION ID
   ========================================================= */

petitionSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const counter = await Counter.findOneAndUpdate(
      {
        _id: "petitions",
      },

      {
        $inc: {
          seq: 1,
        },
      },

      {
        new: true,
        upsert: true,
      },
    );

    this.id = counter.seq;

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Petition", petitionSchema);
