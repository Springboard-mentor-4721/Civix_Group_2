const mongoose = require("mongoose");
const Counter = require("./Counter");

const voteSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    poll_id: { type: Number, required: true, index: true },
    user_id: { type: Number, required: true, index: true },
    selected_option: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true
    }
  },
  { timestamps: true }
);

voteSchema.index({ poll_id: 1, user_id: 1 }, { unique: true });

voteSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "votes" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.id = counter.seq;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Vote", voteSchema);
