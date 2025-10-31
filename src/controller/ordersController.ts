import { Request, Response } from "express";
import { CustomRequest } from "../middlewares/auth";
import ApiErrorRes from "../utils/ApiErrorResponse";
import { Order } from "../database/models/OrdersSchema";

interface CartItem {
  id: string;
  title: "Custom" | "featured";
  price: number;
  quantity: number;
  image?: string;
  meta?: {
    text?: string;
    color?: string;
    size?: string;
    font?: string;
  };
}
// export const createOrder = async (req: CustomRequest, res: Response) => {
//   // 1. Get the items, subtotal, shipping info, payment info and user from the request.
//   // The user ID should be available from your authentication middleware (e.g., req.user.id)
//   const {
//     items,
//     subtotal,
//     shippingInfo,
//   }: {
//     items: CartItem[];
//     subtotal: number;
//     shippingInfo: any;
//   } = req.body;
//   const userId = req.user?.id;

//   if (!items || !subtotal || !shippingInfo) {
//     throw new ApiErrorRes(
//       400,
//       "Please provide items, subtotal, and shipping information."
//     );
//   }

//   // 2. Create NeonSign documents for each item in the order.
//   const createdNeonSigns = await Promise.all(
//     items.map(async (item) => {
//       return await NeonSign.create({
//         title: item.title,
//         font: item.meta?.font,
//         color: item.meta?.color,
//         size: item.meta?.size,
//         text: item.meta?.text,
//         price: item.price,
//         quantity: item.quantity,
//         user: req.user?.id,
//       });
//     })
//   );

//   // 3. Create the new order in your database with a 'Pending' status.
//   const newOrder = await Order.create({
//     user: userId,
//     neonSigns: createdNeonSigns.map((sign) => sign._id),
//     totalAmount: subtotal,
//     shippingAddress: {
//       fullName: shippingInfo.fullName,
//       contact: shippingInfo.contact,
//       address: shippingInfo.address,
//       city: shippingInfo.city,
//       state: shippingInfo.state,
//       zip: shippingInfo.zip,
//     },
//     paymentStatus: "Pending", // Initial status
//   });

//   // --- RAZORPAY INTEGRATION LOGIC GOES HERE ---
//   // At this point, you would create an order with the Razorpay API
//   // using the `price` and the `newOrder._id` from your database.
//   //
//   // Example:
//   // import Razorpay from 'razorpay';
//   // const razorpay = new Razorpay({ key_id: 'KEY', key_secret: 'SECRET' });
//   // const options = {
//   //   amount: price * 100, // Amount in the smallest currency unit (paise)
//   //   currency: "INR",
//   //   receipt: newOrder._id.toString()
//   // };
//   // const razorpayOrder = await razorpay.orders.create(options);
//   //
//   // You would then send the `razorpayOrder.id` and your public `key_id`
//   // to the frontend so it can open the Razorpay payment modal.
//   // The frontend would then handle the payment, and upon success,
//   // a separate endpoint (webhook or confirmation route) would be called
//   // to verify the payment and update the paymentStatus to 'Completed'.

//   res.status(201).json({
//     status: "success",
//     message: "Order created successfully. Please proceed to payment.",
//     data: {
//       order: newOrder,
//       // razorpayOrderId: razorpayOrder.id // You would send this to the client
//     },
//   });
// };

export const getAllOrders = async (req: CustomRequest, res: Response) => {
  // The pre-find hook in your Order model already populates user and neonSign
  const orders = await Order.find();

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: {
      orders,
    },
  });
};

export const getMyOrders = async (req: CustomRequest, res: Response) => {
  const orders = await Order.find({ user: req.user?._id });

  res.status(200).json({
    status: "success",
    results: orders.length,
    orders,
  });
};

export const getOrderById = async (req: CustomRequest, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiErrorRes(404, "No order found with that ID");
  }

  // Optional: Check if the user is an admin or the owner of the order before returning

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
};

export const updateOrderPaymentStatus = async (
  req: CustomRequest,
  res: Response
) => {
  const { paymentStatus } = req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus },
    {
      new: true, // Return the updated document
      runValidators: true, // Ensure the new status is a valid enum value
    }
  );

  if (!order) {
    throw new ApiErrorRes(404, "No order found with that ID");
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
};

export const deleteOrder = async (req: CustomRequest, res: Response) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    throw new ApiErrorRes(404, "No order found with that ID");
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
};
