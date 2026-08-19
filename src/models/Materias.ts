import { Schema, model, Document, Model, Types } from "mongoose";

export interface IMaterias {
  Name: string;
  Description: string;
  Hours: Number;
}

export interface IMateriasDocument extends IMaterias, Document {
  _id: Types.ObjectId;
}

const MateriaSchema = new Schema<IMateriasDocument>(
  {
    Name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [40, "Name cannot exceed 40 characters"],
    },
    Description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [125, "Description cannot exceed 125 characters"],
    },
    Hours: {
      type: Number,
      required: [true, "Hours is required"],
      maxlength: [3, "Hours cannot exceed 3 characters"],
    },
  },
  {
    timestamps: true,
  }
);

const Materia: Model<IMateriasDocument> = model<IMateriasDocument>(
  "Materia",
  MateriaSchema
);

export default Materia;
