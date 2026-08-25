import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Materia, { IMateria } from "../models/Materias";
import Student from "../models/Student";

export async function listMaterias(req: Request, res: Response): Promise<void> {
  const { studentId } = req.query;
  const filter = typeof studentId === "string" ? { studentId } : {};

  try {
    const materias = await Materia.find(filter);
    res.status(200).json({ data: materias });
  } catch (error) {
    res.status(500).json({ error: "Could not fetch materias" });
  }
}

export async function getMateriaById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const materia = await Materia.findById(id);
    if (!materia) {
      res.status(404).json({ error: "Materia not found" });
      return;
    }
    res.status(200).json(materia);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch the materia" });
  }
}

export async function createMateria(
  req: Request<{}, {}, IMateria>,
  res: Response
): Promise<void> {
  try {
    const studentExists = await Student.findById(req.body.studentId);
    if (!studentExists) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const newMateria = await Materia.create(req.body);
    res.status(201).json(newMateria);
  } catch (error) {
    res.status(500).json({ error: "Could not create the materia" });
  }
}

export async function updateMateria(
  req: Request<{ id: string }, {}, Partial<IMateria>>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const updatedMateria = await Materia.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedMateria) {
      res.status(404).json({ error: "Materia not found" });
      return;
    }
    res.status(200).json(updatedMateria);
  } catch (error) {
    res.status(500).json({ error: "Could not update the materia" });
  }
}

export async function deleteMateria(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const deletedMateria = await Materia.findByIdAndDelete(id);
    if (!deletedMateria) {
      res.status(404).json({ error: "Materia not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Could not delete the materia" });
  }
}