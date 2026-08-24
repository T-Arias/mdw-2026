// Authorization code de un solo uso (Authorization Code + PKCE). Vive poco (10 min)
// y se marca consumido apenas se canjea; nunca se reutiliza.
import { Schema, model, Document, Model, Types } from "mongoose";
import { UserRole } from "../types/auth.types";

export type CodeChallengeMethod = "S256" | "plain";

export interface IOAuthAuthorizationCode {
  codeHash: string;
  clientId: string;
  userId: Types.ObjectId;
  role: UserRole;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: CodeChallengeMethod;
  expiresAt: Date;
  consumedAt?: Date;
}

export interface IOAuthAuthorizationCodeDocument extends IOAuthAuthorizationCode, Document {
  _id: Types.ObjectId;
}

const oauthAuthorizationCodeSchema = new Schema<IOAuthAuthorizationCodeDocument>(
  {
    codeHash: {
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
    redirectUri: {
      type: String,
      required: true,
    },
    codeChallenge: {
      type: String,
      required: true,
    },
    codeChallengeMethod: {
      type: String,
      enum: ["S256", "plain"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const OAuthAuthorizationCode: Model<IOAuthAuthorizationCodeDocument> =
  model<IOAuthAuthorizationCodeDocument>("OAuthAuthorizationCode", oauthAuthorizationCodeSchema);

export default OAuthAuthorizationCode;
