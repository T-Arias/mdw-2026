import { Schema, model, Document, Model, Types } from "mongoose";

export interface IMateria {
  name: string;
  year: number;
  status: string;
  studentId: Types.ObjectId;
}

export interface IMateriaDocument extends IMateria, Document {
  _id: Types.ObjectId;
}

const materiaSchema = new Schema<IMateriaDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    status: {
      type: String,
      enum: ["cursando", "aprobada", "regular", "libre"],
      default: "cursando",
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Materia: Model<IMateriaDocument> = model<IMateriaDocument>(
  "Materia",
  materiaSchema
);

export default Materia;