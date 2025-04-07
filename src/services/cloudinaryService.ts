import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.ClOUDINARY_CLOUD_NAME,
  api_key: process.env.ClOUDINARY_API_KEY,
  api_secret: process.env.ClOUDINARY_API_SECRET,
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
    return result.secure_url;
  } catch (error) {
    throw new Error("File Upload failed");
  }
};
