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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.storage = void 0;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
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
        return result.secure_url;
    }
    catch (error) {
        throw new Error("File Upload failed");
    }
});
exports.uploadFile = uploadFile;
