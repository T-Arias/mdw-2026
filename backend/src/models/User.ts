import { Schema, model, Document, Model, Types } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER";
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["ADMIN", "USER"],
      default: "USER",
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUserDocument> = model<IUserDocument>("User", userSchema);

export default User;
