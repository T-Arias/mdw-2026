// Middleware generico y reusable: valida req.body contra cualquier schema de Zod que se le pase.
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const body = req.body === undefined ? {} : req.body;
    const result = schema.safeParse(body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          message: "Los datos enviados no son validos",
          details: result.error.flatten().fieldErrors,
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
