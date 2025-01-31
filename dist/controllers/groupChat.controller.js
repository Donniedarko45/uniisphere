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
exports.sendGroupMessage = exports.createGroup = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, isPrivate } = req.body;
    try {
        const group = yield prisma.group.create({
            data: {
                name,
                description,
                isPrivate,
            },
        });
        res.status(201).json(group);
    }
    catch (error) {
        res.status(500).json({ error: "failed to create a group" });
    }
});
exports.createGroup = createGroup;
const sendGroupMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, groupId, content } = req.body;
    try {
        const message = yield prisma.groupMessage.create({
            data: {
                senderId,
                groupId,
                content,
            },
        });
        res.status(201).json(message);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to send Message" });
    }
});
exports.sendGroupMessage = sendGroupMessage;
// next task deleting the group only the admin can delete the group
// privilages are given to the admin only
/*
 * task1: we have to create a group
 * task2: send group Message
 * task4:deleting the Message
 *
 */
