import { Schema, model, Document, Model, Types } from "mongoose";

export interface IMateria {
  nombre: string;
  codigo: string;
  cargaHoraria: number;
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
      maxlength: [80, "El nombre no puede superar los 80 caracteres"],
    },
    codigo: {
      type: String,
      required: [true, "El codigo es obligatorio"],
      trim: true,
      uppercase: true,
      unique: true,
    },
    cargaHoraria: {
      type: Number,
      required: [true, "La carga horaria es obligatoria"],
    },
    cuatrimestre: {
      type: Number,
      required: [true, "El cuatrimestre es obligatorio"],
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