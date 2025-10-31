import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "An order must be associated with a user."],
    },
    
    // Just store the cart items directly - NO references!
    items: [
      {
        title: { 
          type: String, 
          required: true 
        },
        price: { 
          type: Number, 
          required: true 
        },
        quantity: { 
          type: Number, 
          required: true, 
          default: 1 
        },
        // Custom design details
        meta: {
          font: { type: String, required: true },
          text: { type: String, required: true },
          color: { type: String, required: true },
          size: { type: String, required: true },
        },
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
    
    razorpay: {
      orderId: { type: String, default: null },
      paymentId: { type: String, default: null },
      signature: { type: String, default: null },
    },
    
    paidAt: {
      type: Date,
      default: null,
    },
    
    orderStatus: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
  },
  { timestamps: true }
);

// Only populate user
orderSchema.pre(/^find/, function (next) {
  (this as mongoose.Query<any, any>).populate({
    path: "user",
    select: "name email",
  });
  next();
});

export const Order = mongoose.model("Order", orderSchema);