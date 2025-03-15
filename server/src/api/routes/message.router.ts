import { Router } from "express";
import { checkCache } from "../middlewares/cache.middleware";
import { processMessages } from "../controllers/message.controller";

const router = Router();

router.post("/process", checkCache, processMessages);

export default router;