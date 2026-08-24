// Clientes OAuth registrados via Dynamic Client Registration (RFC7591). Publicos
// (sin client_secret): Claude Desktop y ChatGPT usan PKCE, no un secreto compartido.
import { Schema, model, Document, Model } from "mongoose";

export interface IOAuthClient {
  clientId: string;
  clientName: string;
  redirectUris: string[];
}

export interface IOAuthClientDocument extends IOAuthClient, Document {}

const oauthClientSchema = new Schema<IOAuthClientDocument>(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
    },
    clientName: {
      type: String,
      required: [true, "client_name is required"],
      trim: true,
      maxlength: [120, "client_name cannot exceed 120 characters"],
    },
    redirectUris: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length > 0,
        message: "At least one redirect_uri is required",
      },
    },
  },
  {
    timestamps: true,
  }
);

const OAuthClient: Model<IOAuthClientDocument> = model<IOAuthClientDocument>(
  "OAuthClient",
  oauthClientSchema
);

export default OAuthClient;
