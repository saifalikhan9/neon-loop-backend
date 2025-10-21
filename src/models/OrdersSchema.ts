import mongoose from "mongoose";
// Defines the structure for an order.
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "An order must be associated with a user."],
    },
    neonSigns: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "NeonSign",
        required: [
          true,
          "An order must contain at least one neon sign design.",
        ],
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, "An order must have a total amount."],
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      contact: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
    },
  
    // Details from Razorpay will be stored here.
    razorpay: {
      paymentId: String,
      orderId: String,
      signature: String,
    },
  },
  { timestamps: true }
);

// Populate user and neonSigns fields when querying orders.
orderSchema.pre(/^find/, function (next) {
  (this as mongoose.Query<any, any>).populate([
    {
      path: "user",
      select: "name email",
    },
    {
      path: "neonSigns",
    },
  ]);
  next();
});

export const Order = mongoose.model("Order", orderSchema);
