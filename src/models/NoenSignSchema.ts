import mongoose from "mongoose";
// Defines the structure for the user's custom neon sign design.
const neonSignSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A neon sign must belong to a user."],
    },
    title: {
      type: String,
      required: [true, "Please provide the text for the neon sign."],
      trim: true,
      maxlength: [50, "Title cannot be more than 50 characters long."],
    },
    color: {
      type: String,
      required: [true, "Please select a color."],
    },
    size: {
      type: String,
      required: [true, "Please select a size."],
    },
    font: {
      type: String,
      required: [true, "Please select a font."],
    },
    // The price will be calculated based on the selected options.
    price: {
      type: Number,
      required: [true, "A price must be set for the neon sign."],
    },
    quantity: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Populate the user field automatically when querying neon signs.
neonSignSchema.pre(/^find/, function (next) {
  (this as mongoose.Query<any, any>).populate({
    path: "user",
    select: "name email",
  });
  next();
});

export const NeonSign = mongoose.model("NeonSign", neonSignSchema);
