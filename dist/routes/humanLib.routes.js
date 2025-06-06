"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const humanLib_controller_1 = require("../controllers/humanLib.controller");
const router = (0, express_1.Router)();
router.get("/getOnlineUsers", auth_middleware_1.authenticate, humanLib_controller_1.getOnlineUsers);
exports.default = router;
