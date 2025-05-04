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
exports.BookService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3_config_1 = require("../config/s3.config");
class BookService {
    constructor() {
        this.BASE_PATH = 'unii-books';
    }
    static getInstance() {
        if (!BookService.instance) {
            BookService.instance = new BookService();
        }
        return BookService.instance;
    }
    listAllBooks() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_s3_1.ListObjectsV2Command({
                    Bucket: s3_config_1.BUCKET_NAME,
                    Prefix: this.BASE_PATH
                });
                const response = yield s3_config_1.s3Client.send(command);
                if (!response.Contents) {
                    return [];
                }
                const books = yield Promise.all(response.Contents
                    .filter(item => item.Key && !item.Key.endsWith('/'))
                    .map((item) => __awaiter(this, void 0, void 0, function* () {
                    if (!item.Key)
                        return null;
                    const getObjectCommand = new client_s3_1.GetObjectCommand({
                        Bucket: s3_config_1.BUCKET_NAME,
                        Key: item.Key,
                    });
                    const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3_config_1.s3Client, getObjectCommand, {
                        expiresIn: 3600,
                    });
                    return {
                        key: item.Key,
                        name: item.Key.split('/').pop() || '',
                        url,
                        lastModified: item.LastModified,
                    };
                }))).then(books => books.filter((book) => book !== null));
                return books;
            }
            catch (error) {
                console.error('Error listing books:', error);
                throw error;
            }
        });
    }
}
exports.BookService = BookService;
