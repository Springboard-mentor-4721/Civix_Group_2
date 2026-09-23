const mongoose = require("mongoose");
const Counter = require("./Counter");

const adminLogSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true
    },

    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    user_id: {
      type: Number,
      required: true,
      index: true
    },

    petition_id: {
      type: Number,
      index: true
    }
  },
  {
    timestamps: true
  }
);

adminLogSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "admin_logs" },
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

module.exports = mongoose.model("AdminLog", adminLogSchema);