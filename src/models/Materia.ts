import { Schema, model, Document, Model, Types } from "mongoose";

export interface IMateria {
  nombre: string;
  codigo: string;
  carrera: string;
  creditos: number;
  anio: number;
  descripcion: string;
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
      maxlength: [120, "El nombre no puede superar los 120 caracteres"],
    },
    codigo: {
      type: String,
      required: [true, "El código es obligatorio"],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [20, "El código no puede superar los 20 caracteres"],
    },
    carrera: {
      type: String,
      required: [true, "La carrera es obligatoria"],
      trim: true,
    },
    creditos: {
      type: Number,
      required: [true, "Los créditos son obligatorios"],
      min: [1, "Los créditos deben ser al menos 1"],
      max: [12, "Los créditos no pueden superar 12"],
    },
    anio: {
      type: Number,
      required: [true, "El año es obligatorio"],
      min: [1, "El año debe estar entre 1 y 6"],
      max: [6, "El año debe estar entre 1 y 6"],
    },
    descripcion: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "La descripción no puede superar los 500 caracteres"],
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