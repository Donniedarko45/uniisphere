import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import fs from 'fs';

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

// Enhanced upload function for blog media
export const uploadBlogMedia = async (file: Express.Multer.File) => {
  try {
    const isVideo = file.mimetype.startsWith('video/');
    const uploadOptions: any = {
      resource_type: isVideo ? "video" : "image",
      folder: "blog_media",
    };

    // Add video-specific options
    if (isVideo) {
      uploadOptions.eager = [
        { format: "mp4", duration: "30.0" }, // Limit video duration to 30 seconds
      ];
      uploadOptions.eager_async = true;
      uploadOptions.chunk_size = 6000000; // 6MB chunks for better upload handling
    } else {
      // Image-specific options
      uploadOptions.eager = [
        { width: 1920, height: 1080, crop: "limit" }, // Limit max dimensions
        { width: 800, quality: "auto:good", format: "auto" }, // Optimized version
      ];
    }

    const result = await cloudinary.uploader.upload(file.path, uploadOptions);
    
    // Clean up the temporary file
    fs.unlinkSync(file.path);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: isVideo ? "video" : "image",
      format: result.format,
      duration: result.duration || null, // Only for videos
    };
  } catch (error: any) {
    // Clean up the temporary file even if upload fails
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new Error(`Media Upload failed: ${error.message}`);
  }
};
