import { Router } from "express";
import { checkCache } from "../middlewares/cache.middleware";
import { processMessages } from "../controllers/message.controller";
import { apiLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post("/process", apiLimiter ,checkCache, processMessages);

export default router;