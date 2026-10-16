const mongoose = require("mongoose");
const Counter = require("./Counter");

const governanceResponseSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true
    },

    petition_id: {
      type: Number,
      required: true,
      index: true
    },

    official_id: {
      type: Number,
      required: true,
      index: true
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    status: {
      type: String,
      enum: ["active", "under_review", "closed"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

governanceResponseSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "governance_responses" },
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true
      }
    );

    this.id = counter.seq;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model(
  "GovernanceResponse",
  governanceResponseSchema
);