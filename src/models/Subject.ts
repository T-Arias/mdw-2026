import { Schema, model, Document, Model, Types } from "mongoose";

export interface ISubject {
  name: string;
  career: string;
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
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    career: {
      type: String,
      required: [true, "Career is required"],
      trim: true,
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
