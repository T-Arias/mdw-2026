import { Schema, model, Document, Model, Types } from "mongoose";

export interface IStudent {
  firstName: string;
  lastName: string;
  email: string;
  career: string;
  enrollmentDate: Date;
  active: boolean;
}

export interface IStudentDocument extends IStudent, Document {
  _id: Types.ObjectId;
}

const studentSchema = new Schema<IStudentDocument>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [80, "First name cannot exceed 80 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [80, "Last name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    career: {
      type: String,
      required: [true, "Career is required"],
      trim: true,
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

const Student: Model<IStudentDocument> = model<IStudentDocument>(
  "Student",
  studentSchema
);

export default Student;
