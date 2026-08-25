import { Schema, model, Document, Model, Types } from "mongoose";

export interface IMaterias {
  nombre: string;
  profesor: string;
  career: string;
  horario: string;
  active: boolean;
}

export interface IMateriasDocument extends IMaterias, Document {
  _id: Types.ObjectId;
}

const materiaSchema = new Schema<IMateriasDocument>(
  {
    nombre: {
      type: String,
      required: [true, "Nombre de materia es requerido"],
      trim: true,
      maxlength: [80, "max 80 caracteres"],
    },
    profesor: {
      type: String,
      required: [true, "Profesor es requerido"],
      trim: true,
    },
    career: {
      type: String,
      required: [true, "Career es requerido"],
      trim: true,
    },
    horario: {
      type: String,
      required: [true, "Horario es requerido"],
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

const Materia: Model<IMateriasDocument> = model<IMateriasDocument>(
  "Materia",
  materiaSchema
);

export default Materia;
