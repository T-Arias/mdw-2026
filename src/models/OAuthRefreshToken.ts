// Refresh tokens del flujo OAuth, separados de ApiToken (que solo modela access
// tokens). Rotan en cada uso: canjear uno lo revoca y emite uno nuevo.
import { Schema, model, Document, Model, Types } from "mongoose";
import { UserRole } from "../types/auth.types";

export type OAuthRefreshTokenStatus = "ACTIVE" | "REVOKED";

export interface IOAuthRefreshToken {
  tokenHash: string;
  clientId: string;
  userId: Types.ObjectId;
  role: UserRole;
  status: OAuthRefreshTokenStatus;
  expiresAt: Date;
}

export interface IOAuthRefreshTokenDocument extends IOAuthRefreshToken, Document {
  _id: Types.ObjectId;
}

const oauthRefreshTokenSchema = new Schema<IOAuthRefreshTokenDocument>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    clientId: {
      type: String,
      required: true,
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
    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED"],
      default: "ACTIVE",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const OAuthRefreshToken: Model<IOAuthRefreshTokenDocument> = model<IOAuthRefreshTokenDocument>(
  "OAuthRefreshToken",
  oauthRefreshTokenSchema
);

export default OAuthRefreshToken;
