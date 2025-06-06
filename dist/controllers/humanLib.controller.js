"use strict";
/*
nickname --> user will enter his name backend will marked his status to online than other user will do the same enter his nickname it will marks it to online and
in message it will show his  nickname and user will start to  chat
*/
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
exports.getOnlineUsers = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getOnlineUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const onlineUsers = yield prisma_1.default.user.findMany({
        where: { isOnline: true },
        select: {
            id: true,
            humanLibSent: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: { nickname: true },
            },
        },
    });
    const result = onlineUsers.map((u) => {
        var _a, _b;
        return ({
            id: u.id,
            nickname: ((_b = (_a = u.humanLibSent) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.nickname) || 'Anonymous',
        });
    });
    res.json(result);
});
exports.getOnlineUsers = getOnlineUsers;
