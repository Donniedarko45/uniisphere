import express, { Router } from "express";
import { createPost } from "../controllers/post.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();
router.post("/create-post", upload.single("media"), createPost);

export default router;

