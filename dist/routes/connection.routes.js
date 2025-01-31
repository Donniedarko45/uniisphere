"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_2 = require("express");
const connection_controller_1 = require("../controllers/connection.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const app = (0, express_1.default)();
const router = (0, express_2.Router)();
app.use(express_1.default.urlencoded({ extended: true }));
router.post("/connect/:userId", auth_middleware_1.authenticate, connection_controller_1.sendConnectionRequest);
router.post('/accept/:connectionId', auth_middleware_1.authenticate, connection_controller_1.acceptConnection);
router.post('/decline/:connectionId', auth_middleware_1.authenticate, connection_controller_1.declineConnection);
router.get('/connections', auth_middleware_1.authenticate, connection_controller_1.getConnections);
exports.default = router;
