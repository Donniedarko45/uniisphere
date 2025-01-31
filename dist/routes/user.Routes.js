"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
router.get("/updateprofile", auth_middleware_1.authenticate, user_controller_1.updateProfile);
router.get("/profile/:userId", user_controller_1.getProfile);
exports.default = router;
