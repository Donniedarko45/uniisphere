import {Router} from "express";
import {authenticate} from "../middlewares/auth.middleware"
import {getOnlineUsers} from "../controllers/humanLib.controller"

const router = Router();

router.get("/getOnlineUsers",authenticate,getOnlineUsers);

export default router;