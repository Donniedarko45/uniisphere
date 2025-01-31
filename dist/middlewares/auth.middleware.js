"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next(new Error("No token provided"));
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = (0, jwt_utils_1.verifyToken)(token);
        if (!decoded || !decoded.userId) {
            return next(new Error("Invalid token"));
        }
        req.userId = decoded.userId;
        return next();
    }
    catch (error) {
        console.error("Token verification error:", error);
        return next(error);
    }
};
exports.authenticate = authenticate;
