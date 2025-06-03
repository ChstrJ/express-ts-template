import { ErrorCode } from "@common/constants/error-code";
import { GeneralMessage } from "@common/constants/message";
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
        res.send({
          error: true,
          timestamp: Date.now(),
          code: ErrorCode.BAD_REQUEST,
          message: GeneralMessage.BAD_REQUEST,
          errors: errors
        })
      }
    }
  }
}
