import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Materia, { IMateria } from "../models/Materia";

export async function listMaterias(_req: Request, res: Response): Promise<void> {
  try {
    const materias = await Materia.find().sort({ nombre: 1 });
    res.status(200).json(materias);
  } catch (error) {
    console.error("[materias] error listing:", error);
    res.status(500).json({ error: "No se pudieron obtener las materias" });
  }
}

export async function getMateriaById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id proporcionado no es válido" });
    return;
  }

  try {
    const materia = await Materia.findById(id);

    if (!materia) {
      res.status(404).json({ error: "Materia no encontrada" });
      return;
    }

    res.status(200).json(materia);
  } catch (error) {
    res.status(500).json({ error: "No se pudo obtener la materia" });
  }
}

export async function createMateria(
  req: Request<{}, {}, Partial<IMateria>>,
  res: Response
): Promise<void> {
  try {
    const newMateria = await Materia.create(req.body);
    res.status(201).json(newMateria);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[materias] error creating:", error);
    res.status(500).json({ error: "No se pudo crear la materia" });
  }
}

export async function updateMateria(
  req: Request<{ id: string }, {}, Partial<IMateria>>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id proporcionado no es válido" });
    return;
  }

  try {
    const updatedMateria = await Materia.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedMateria) {
      res.status(404).json({ error: "Materia no encontrada" });
      return;
    }

    res.status(200).json(updatedMateria);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[materias] error updating:", error);
    res.status(500).json({ error: "No se pudo actualizar la materia" });
  }
}

export async function deleteMateria(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id proporcionado no es válido" });
    return;
  }

  try {
    const deletedMateria = await Materia.findByIdAndDelete(id);

    if (!deletedMateria) {
      res.status(404).json({ error: "Materia no encontrada" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[materias] error deleting:", error);
    res.status(500).json({ error: "No se pudo eliminar la materia" });
  }
}