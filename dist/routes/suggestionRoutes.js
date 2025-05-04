"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const suggestionController_1 = require("../controllers/suggestionController");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticate);
// Get user suggestions
router.get('/', auth_middleware_1.authenticate, suggestionController_1.SuggestionController.getSuggestions);
exports.default = router;
