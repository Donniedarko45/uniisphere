import { Request } from "express";
import fs from "fs";
import multer, { FileFilterCallback } from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) {
    const uploadPath = path.join(__dirname, "../../public/temp");
    // Create directory if it doesn't exist
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
      }
      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error, uploadPath);
    }
  },
  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4/;
    const extname = allowedTypes.test(file.mimetype);
    const mimetypeCheck = allowedTypes.test(
      file.originalname.split(".").pop() || "",
    );
    console.log(mimetypeCheck);

    if (extname && mimetypeCheck) {
      console.log("doneeeeeeeeeeeeeeeeee");
      return cb(null, true);
    } else {
      cb(new Error("Error: File type not supported!"));
    }
  },
});

// Enhanced upload middleware for stories (supports images and videos)
export const storyUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for stories (to accommodate videos)
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    // Allow images and videos for stories
    const allowedImageTypes = /jpeg|jpg|png|gif/;
    const allowedVideoTypes = /mp4|avi|mov|wmv|flv|webm/;

    const isImage = allowedImageTypes.test(file.mimetype);
    const isVideo = allowedVideoTypes.test(file.mimetype);

    const imageMimetypeCheck = file.mimetype.startsWith("image/");
    const videoMimetypeCheck = file.mimetype.startsWith("video/");

    if ((isImage && imageMimetypeCheck) || (isVideo && videoMimetypeCheck)) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Error: Only images (JPEG, JPG, PNG, GIF) and videos (MP4, AVI, MOV, WMV, FLV, WEBM) are supported for stories!",
        ),
      );
    }
  },
});
