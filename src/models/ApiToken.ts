import { Schema, model, Document, Model, Types } from "mongoose";
import { UserRole } from "../types/auth.types";

export type ApiTokenStatus = "ACTIVE" | "REVOKED";

export interface IApiToken {
  name: string;
  userId: Types.ObjectId;
  role: UserRole;
  tokenHash: string;
  status: ApiTokenStatus;
  expiresAt: Date;
  lastUsedAt?: Date;
}

export interface IApiTokenDocument extends IApiToken, Document {
  _id: Types.ObjectId;
}

const apiTokenSchema = new Schema<IApiTokenDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "USER"],
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED"],
      default: "ACTIVE",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const ApiToken: Model<IApiTokenDocument> = model<IApiTokenDocument>("ApiToken", apiTokenSchema);

export default ApiToken;
