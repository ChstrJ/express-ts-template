import { GeneralMessage } from '@common/constants/message';
import { formatError } from '@utils/helpers';
import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { AnyZodObject } from 'zod';

export const validateRequest = (schema: AnyZodObject | any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = !_.isEmpty(req.files) ? { ...req.body, ...req.files } : req.body;

      const parsedData = schema.safeParse(data);

      if (!parsedData.success) {
        const formattedErrors = formatError(parsedData);

        return res.status(400).send({
          error: true,
          timestamp: Date.now(),
          message: GeneralMessage.BAD_REQUEST,
          errors: formattedErrors
        });
      }
      req.body = parsedData.data;
      return next();
    } catch (err: any) {
      return next(err);
    }
  };
};
