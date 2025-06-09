"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBlogMedia = exports.uploadFile = exports.storage = void 0;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const fs_1 = __importDefault(require("fs"));
cloudinary_1.v2.config({
    cloud_name: process.env.ClOUDINARY_CLOUD_NAME,
    api_key: process.env.ClOUDINARY_API_KEY,
    api_secret: process.env.ClOUDINARY_API_SECRET,
});
exports.storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: () => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            folder: "book",
            allowed_formats: ["pdf", "jpg", "jpeg", "png"],
        });
    }),
});
const uploadFile = (file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield cloudinary_1.v2.uploader.upload(file.path, {
            resource_type: "auto",
        });
        // Clean up the temporary file
        fs_1.default.unlinkSync(file.path);
        return result.secure_url;
    }
    catch (error) {
        // Clean up the temporary file even if upload fails
        if (fs_1.default.existsSync(file.path)) {
            fs_1.default.unlinkSync(file.path);
        }
        throw new Error("File Upload failed");
    }
});
exports.uploadFile = uploadFile;
// Enhanced upload function for blog media
const uploadBlogMedia = (file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isVideo = file.mimetype.startsWith('video/');
        const uploadOptions = {
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
        }
        else {
            // Image-specific options
            uploadOptions.eager = [
                { width: 1920, height: 1080, crop: "limit" }, // Limit max dimensions
                { width: 800, quality: "auto:good", format: "auto" }, // Optimized version
            ];
        }
        const result = yield cloudinary_1.v2.uploader.upload(file.path, uploadOptions);
        // Clean up the temporary file
        fs_1.default.unlinkSync(file.path);
        return {
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: isVideo ? "video" : "image",
            format: result.format,
            duration: result.duration || null, // Only for videos
        };
    }
    catch (error) {
        // Clean up the temporary file even if upload fails
        if (fs_1.default.existsSync(file.path)) {
            fs_1.default.unlinkSync(file.path);
        }
        throw new Error(`Media Upload failed: ${error.message}`);
    }
});
exports.uploadBlogMedia = uploadBlogMedia;
