import { Router } from "express";
import { processMessages } from "../controllers/message.controller";
import { checkCache } from "../middlewares/cache.middleware";

const router = Router();

router.post("/process", checkCache,processMessages);

export default router;