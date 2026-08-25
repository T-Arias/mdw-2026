import { Schema, model, Document, Model, Types } from "mongoose";

export interface IMaterias {
    nombre: string;
    estado: boolean;
    promedio: number;
}

export interface IMateriaDocument extends IMaterias, Document {
    _id: Types.ObjectId;
}

const materiaSchema = new Schema<IMateriaDocument>(
    {
        nombre: {
            type: String,
            required: [true, "El nombre de la materia es obligatorio"],
            trim: true,
            maxlength: [100, "El nombre no puede exceder los 100 caracteres"],
        },
        estado: {
            type: Boolean,
            default: true,
        },
        promedio: {
            type: Number,
            required: [true, "El promedio es obligatorio"],
            min: [0, "El promedio mínimo es 0"],
            max: [10, "El promedio máximo es 10"],
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
