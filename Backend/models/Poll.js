const mongoose = require("mongoose");
const Counter = require("./Counter");

const pollSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    title: { type: String, required: true, maxlength: 200, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) =>
          Array.isArray(options) &&
          options.length >= 2 &&
          options.length <= 10 &&
          options.every(
            (option) =>
              typeof option === "string" &&
              option.trim().length > 0 &&
              option.trim().length <= 100
          ),
        message: "A poll must contain 2 to 10 non-empty options"
      }
    },
    created_by: { type: Number, required: true, index: true },
    target_location: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
      index: true
    }
  },
  { timestamps: true }
);

pollSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "polls" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.id = counter.seq;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Poll", pollSchema);
