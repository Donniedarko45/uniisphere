"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyUpload = exports.upload = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path_1.default.join(__dirname, '../../public/temp');
        // Create directory if it doesn't exist
        try {
            if (!fs_1.default.existsSync(uploadPath)) {
                fs_1.default.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
            }
            cb(null, uploadPath);
        }
        catch (error) {
            cb(error, uploadPath);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(file.mimetype);
        const mimetypeCheck = allowedTypes.test(file.originalname.split(".").pop() || "");
        if (extname && mimetypeCheck) {
            return cb(null, true);
        }
        else {
            cb(new Error("Error: File type not supported!"));
        }
    },
});
// Enhanced upload middleware for stories (supports images and videos)
exports.storyUpload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB for stories (to accommodate videos)
    },
    fileFilter: (req, file, cb) => {
        // Allow images and videos for stories
        const allowedImageTypes = /jpeg|jpg|png|gif/;
        const allowedVideoTypes = /mp4|avi|mov|wmv|flv|webm/;
        const isImage = allowedImageTypes.test(file.mimetype);
        const isVideo = allowedVideoTypes.test(file.mimetype);
        const imageMimetypeCheck = file.mimetype.startsWith('image/');
        const videoMimetypeCheck = file.mimetype.startsWith('video/');
        if ((isImage && imageMimetypeCheck) || (isVideo && videoMimetypeCheck)) {
            return cb(null, true);
        }
        else {
            cb(new Error("Error: Only images (JPEG, JPG, PNG, GIF) and videos (MP4, AVI, MOV, WMV, FLV, WEBM) are supported for stories!"));
        }
    },
});
