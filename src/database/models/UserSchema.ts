import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import ApiErrorRes from "../../utills/ApiErrorResponse";

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

// ✅ ADD THIS: Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash if password is modified (or new)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password as string, 12);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 3. Add your instance method.
userSchema.methods.correctPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new ApiErrorRes(400, "Password verification failed", error as any);
  }
};

// 4. Create and export the model, applying the IUser interface.
const User = mongoose.model<IUser>("User", userSchema);

export default User;
