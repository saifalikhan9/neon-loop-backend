import { Response } from "express";
import { CustomRequest } from "../middlewares/auth";
import { razorpay } from "../utills/razorpay";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { constants } from "../utills/constants";
import ApiErrorRes from "../utills/ApiErrorResponse";
import { Order } from "../database/models/OrdersSchema";
import { getNeonSignPrice, PRICING } from "../utills/getPrice";
import { CartItem, ShippingData } from "../types/OrderTypes";

export const createRazorpayOrder = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const {
      items,
      shippingAddress,
      totalAmount,
    }: {
      items: CartItem[];
      totalAmount: number;
      shippingAddress: ShippingData;
    } = req.body;
    const userId = req.user?._id;

    if (!items || items.length === 0) {
      throw new ApiErrorRes(400, "No neon signs in order");
    }

    if (!shippingAddress || !totalAmount) {
      throw new ApiErrorRes(400, "Missing required fields");
    }

    let serverCalculatedTotal = 0;

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Validate required fields
      if (!item.meta?.size) {
        throw new ApiErrorRes(400, `Item ${i + 1}: Size is required`);
      }

      if (!item.quantity || item.quantity < 1) {
        throw new ApiErrorRes(400, `Item ${i + 1}: Invalid quantity`);
      }

      // Get the CORRECT price from server
      let correctPrice: number;
      try {
        correctPrice = getNeonSignPrice(item.meta.size);
      } catch (error) {
        throw new ApiErrorRes(
          400,
          `Item ${i + 1}: Invalid size "${item.meta.size}"`
        );
      }

      // Compare client price with server price
      if (item.price !== correctPrice) {
        throw new ApiErrorRes(
          400,
          `Item ${i + 1}: Price mismatch. Expected ₹${correctPrice}, got ₹${
            item.price
          }`
        );
      }

      // Add to server-calculated total
      serverCalculatedTotal += correctPrice * item.quantity;
    }

    // Add tax and shipping
    const tax = Math.round(serverCalculatedTotal * PRICING.tax);
    const shippingCost = PRICING.shippingCost;
    serverCalculatedTotal = serverCalculatedTotal + tax + shippingCost;

    // Validate total amount
    if (Math.abs(serverCalculatedTotal - totalAmount) > 1) {
      throw new ApiErrorRes(
        400,
        `Total amount mismatch. Expected ₹${serverCalculatedTotal}, got ₹${totalAmount}`
      );
    }

    // Step 1: Create order in YOUR database first
    const order = await Order.create({
      user: userId,
      items,
      totalAmount,
      shippingAddress,
      paymentStatus: "Pending",
      orderStatus: "Processing",
    });
    if (!order) {
      throw new ApiErrorRes(500, "failes to create the orders");
    }

    // Step 2: Create Razorpay order
    const razorpayOptions = {
      amount: totalAmount * 100, // Convert to paise
      currency: "INR",
      receipt: order._id.toString(), // Use your DB order ID as receipt
      notes: {
        orderId: order._id.toString(),
        userId: userId?.toString() as string,
        customerName: shippingAddress.fullName,
      },
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);
    if (!razorpayOrder) {
      console.log(razorpayOrder, "razxor");
      throw new ApiErrorRes(400, "failed");
    }
    // Step 3: Update your order with Razorpay order ID
    // @ts-ignore
    order.razorpay.orderId = razorpayOrder.id;
    await order.save();

    // Step 4: Return both order details
    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
      },
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      razorpayKeyId: constants.razorpay_id, // Frontend needs this
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
};

// Route to handle payment verification
export const verifyPayment = async (req: CustomRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiErrorRes(400, "Missing payment details");
    }

    const secret = constants.razorpay_secret;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    // Verify signature
    const isValidSignature = validateWebhookSignature(
      body,
      razorpay_signature,
      secret
    );

    if (isValidSignature) {
      // Find order by Razorpay order ID
      const order = await Order.findOne({
        "razorpay.orderId": razorpay_order_id,
      });

      if (!order) {
        throw new ApiErrorRes(404, "Order not found");
      }
      if (!order.razorpay) {
        throw new ApiErrorRes(404, "razorpay object is not found in order");
      }

      // Check if already paid
      if (order.paymentStatus === "Completed") {
        return res.status(400).json({
          success: false,
          message: "Payment already completed for this order",
        });
      }

      // Update order with payment details
      order.paymentStatus = "Completed";
      order.razorpay.paymentId = razorpay_payment_id;
      order.razorpay.signature = razorpay_signature;
      order.paidAt = new Date();
      await order.save();

      console.log("✅ Payment verification successful for order:", order._id);

      // TODO: Additional actions after successful payment
      // - Send confirmation email
      // - Send SMS notification
      // - Update inventory
      // - Notify admin

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        orderId: order._id,
        order: {
          _id: order._id,
          totalAmount: order.totalAmount,
          paymentStatus: order.paymentStatus,
          paidAt: order.paidAt,
        },
      });
    } else {
      console.error("❌ Payment verification failed - invalid signature");

      // Update order status to Failed
      await Order.findOneAndUpdate(
        { "razorpay.orderId": razorpay_order_id },
        {
          paymentStatus: "Failed",
          "razorpay.paymentId": razorpay_payment_id,
        }
      );

      res.status(400).json({
        success: false,
        message: "Payment verification failed - invalid signature",
      });
    }
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};
