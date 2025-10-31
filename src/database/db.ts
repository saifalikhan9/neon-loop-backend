import { constants } from "../utils/constants";
import mongoose from "mongoose";

const connectDB = async () => {
  console.log(constants);
  try {
    const connectionInstance = await mongoose.connect(`${constants.dbURL}`);
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;
