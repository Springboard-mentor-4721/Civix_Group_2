const mongoose = require("mongoose");
const Counter = require("./Counter");

const signatureSchema = new mongoose.Schema(
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

    user_id: {
      type: Number,
      required: true,
      index: true
    },

    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

signatureSchema.index(
  {
    petition_id: 1,
    user_id: 1
  },
  {
    unique: true
  }
);

signatureSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "signatures" },
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

module.exports = mongoose.model("Signature", signatureSchema);