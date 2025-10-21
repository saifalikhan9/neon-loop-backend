import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import ApiErrorRes from "../utills/ApiErrorResponse";

// 1. Create an interface representing a document in MongoDB.
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  // Add the custom method signature here
  correctPassword(candidatePassword: string): Promise<boolean>;
}

// 2. Create a Schema corresponding to the document interface.
const userSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Good practice to hide password by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// 3. Add your instance method.
// Use the refined version that uses `this`.
// IMPORTANT: Do NOT use an arrow function here, or `this` will be incorrect.
userSchema.methods.correctPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new ApiErrorRes(400, "password not matched ",error as any);
  }
};

// 4. Create and export the model, applying the IUser interface.
const User = mongoose.model<IUser>("User", userSchema);

export default User;
