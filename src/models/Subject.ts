import { Schema, model, Document, Model, Types } from "mongoose";

export interface ISubject {
  name: string;
  code: string;
  description?: string;
  credits: number;
  year: number;
  active: boolean;
}

export interface ISubjectDocument extends ISubject, Document {
  _id: Types.ObjectId;
}

const subjectSchema = new Schema<ISubjectDocument>(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      maxlength: [120, "Subject name cannot exceed 120 characters"],
    },
    code: {
      type: String,
      required: [true, "Code is required"],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [20, "Code cannot exceed 20 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    credits: {
      type: Number,
      required: [true, "Credits are required"],
      min: [1, "Credits must be at least 1"],
      max: [20, "Credits cannot exceed 20"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [1, "Year must be at least 1"],
      max: [6, "Year cannot exceed 6"],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Subject: Model<ISubjectDocument> = model<ISubjectDocument>(
  "Subject",
  subjectSchema
);

export default Subject;
