const mongoose = require("mongoose");
const Counter = require("./Counter");

const userSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 150,
      trim: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true,
      maxlength: 255,
      select: false
    },

    role: {
      type: String,
      required: true,
      enum: ["citizen", "official"]
    },

    location: {
      type: String,
      maxlength: 150,
      trim: true
    },

    latitude: {
      type: Number,
      min: -90,
      max: 90
    },

    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "users" },
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

module.exports = mongoose.model("User", userSchema);