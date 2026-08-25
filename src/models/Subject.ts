import { Schema, model, Document, Model, Types } from "mongoose";

export interface ISubject {
  name: string;
  code: string;
  career: string;
  credits: number;
  year: number;
  description: string;
  active: boolean;
}

export interface ISubjectDocument extends ISubject, Document {
  _id: Types.ObjectId;
}

const subjectSchema = new Schema<ISubjectDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    code: {
      type: String,
      required: [true, "Code is required"],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [20, "Code cannot exceed 20 characters"],
    },
    career: {
      type: String,
      required: [true, "Career is required"],
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, "Credits are required"],
      min: [1, "Credits must be at least 1"],
      max: [12, "Credits cannot exceed 12"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [1, "Year must be between 1 and 6"],
      max: [6, "Year must be between 1 and 6"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
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
