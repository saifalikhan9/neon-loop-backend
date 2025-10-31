
import Razorpay from "razorpay";
import { constants } from "./constants";


export const razorpay = new Razorpay({
  key_id: constants.razorpay_id,
  key_secret: constants.razorpay_secret,
});