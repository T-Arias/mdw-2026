import { Schema, model, Document, Model, Types } from "mongoose";

export const CUATRIMESTRES = ["primero", "segundo", "anual"] as const;
export type Cuatrimestre = (typeof CUATRIMESTRES)[number];

export interface IMateria {
  nombre: string;
  codigo: string;
  creditos: number;
  anio: number;
  cuatrimestre: Cuatrimestre;
  carrera: string;
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
      // Dos a cuatro letras, guion, tres dígitos. Ej: MDW-401
      match: [/^[A-Z]{2,4}-\d{3}$/, "Formato de código inválido (ej: MDW-401)"],
    },
    creditos: {
      type: Number,
      required: [true, "Los créditos son obligatorios"],
      min: [1, "Los créditos no pueden ser menos de 1"],
      max: [20, "Los créditos no pueden superar 20"],
    },
    anio: {
      type: Number,
      required: [true, "El año de cursada es obligatorio"],
      min: [1, "El año no puede ser menor a 1"],
      max: [6, "El año no puede ser mayor a 6"],
    },
    cuatrimestre: {
      type: String,
      required: [true, "El cuatrimestre es obligatorio"],
      enum: {
        values: CUATRIMESTRES,
        message: `El cuatrimestre debe ser uno de: ${CUATRIMESTRES.join(", ")}`,
      },
    },
    carrera: {
      type: String,
      required: [true, "La carrera es obligatoria"],
      trim: true,
      maxlength: [120, "La carrera no puede superar los 120 caracteres"],
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

const Materia: Model<IMateriaDocument> = model<IMateriaDocument>("Materia", materiaSchema);

export default Materia;
