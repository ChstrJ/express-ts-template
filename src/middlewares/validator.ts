import { NextFunction, Request, Response } from "express";
import { AnyZodObject, z } from "zod";

export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400);
        const errors = err.formErrors.fieldErrors;
        res.send({ errors: errors })
      }
    }
  }
}
