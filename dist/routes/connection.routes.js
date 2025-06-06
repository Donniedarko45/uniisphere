"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const connection_controller_1 = require("../controllers/connection.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rateLimiter_middleware_1 = require("../middlewares/rateLimiter.middleware");
const app = (0, express_1.default)();
const router = (0, express_1.Router)();
app.use(express_1.default.urlencoded({ extended: true }));
// Apply connection rate limiting to prevent spam
router.post("/connect/:userId", auth_middleware_1.authenticate, rateLimiter_middleware_1.connectionLimiter, connection_controller_1.sendConnectionRequest);
router.post('/accept/:connectionId', auth_middleware_1.authenticate, connection_controller_1.acceptConnection);
router.post('/decline/:connectionId', auth_middleware_1.authenticate, connection_controller_1.declineConnection);
// Apply database intensive limiter to routes that fetch multiple connections
router.post('/getPending/', auth_middleware_1.authenticate, rateLimiter_middleware_1.dbIntensiveLimiter, connection_controller_1.getPendingRequests);
router.get('/connections', auth_middleware_1.authenticate, rateLimiter_middleware_1.dbIntensiveLimiter, connection_controller_1.getConnections);
router.get('/stats/:userId', auth_middleware_1.authenticate, connection_controller_1.getConnectionStats);
exports.default = router;
