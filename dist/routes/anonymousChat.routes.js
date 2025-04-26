"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const anonymous_controller_1 = require("../controllers/anonymous.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Create or join an anonymous chat
router.post('/create', auth_middleware_1.authenticate, anonymous_controller_1.createAnonymousChat);
// Send a message in an anonymous chat
router.post('/message', auth_middleware_1.authenticate, anonymous_controller_1.sendAnonymousMessage);
// End an anonymous chat
router.post('/end/:chatId', auth_middleware_1.authenticate, anonymous_controller_1.endAnonymousChat);
exports.default = router;
