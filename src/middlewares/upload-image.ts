import multer from "multer";
import { NextFunction, Request, Response } from "express";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadAndProcessFile = (fieldName: string) =>
    (req: Request, res: Response, next: NextFunction) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err) {
                return next(err);
            }

            if (req.file) {
                req.body[fieldName] = req.file; // attach file to body
            }

            next();
        });
    };
