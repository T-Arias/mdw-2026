import { Schema, model, Document, Model, Types } from "mongoose";

export interface IMateria {
  nombre: string;
  codigo: string;
  creditos: number;
  cuatrimestre: number;
  activa: boolean;
}

export interface IMateriaDocument extends IMateria, Document {
  _id: Types.ObjectId;
}

const materiaSchema = new Schema<IMateriaDocument>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede superar los 100 caracteres"],
    },
    codigo: {
      type: String,
      required: [true, "El código es obligatorio"],
      trim: true,
      uppercase: true,
      unique: true,
    },
    creditos: {
      type: Number,
      required: [true, "Los créditos son obligatorios"],
      min: [1, "Los créditos deben ser al menos 1"],
    },
    cuatrimestre: {
      type: Number,
      required: [true, "El cuatrimestre es obligatorio"],
      min: [1, "El cuatrimestre debe ser al menos 1"],
      max: [10, "El cuatrimestre no puede superar 10"],
    },
    activa: {
      type: Boolean,
      default: true,
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