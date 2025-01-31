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
exports.sendMessage = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, receiverId, content } = req.body;
    try {
        const message = yield prisma.message.create({
            data: {
                senderId,
                receiverId,
                content,
            },
        });
        res.status(201).json(message);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to send message" });
    }
});
exports.sendMessage = sendMessage;
