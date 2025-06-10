import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import fs, { promises as fsPromises } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import os from 'os';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async () => ({
    folder: "book",
    allowed_formats: ["pdf", "jpg", "jpeg", "png"],
  }),
});

export const uploadFile = async (file: Express.Multer.File) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
    });
    // Clean up the temporary file
    fs.unlinkSync(file.path);
    return result.secure_url;
  } catch (error) {
    // Clean up the temporary file even if upload fails
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new Error("File Upload failed");
  }
};
