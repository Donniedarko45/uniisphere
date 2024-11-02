import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, "./public/temp"); 
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); 
  },
});
export const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, 
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.mimetype);
    const mimetypeCheck = allowedTypes.test(file.originalname.split('.').pop() || '');

    if (extname && mimetypeCheck) {
      return cb(null, true);
    } else {
      cb(new Error("Error: File type not supported!"));
    }
  },
});