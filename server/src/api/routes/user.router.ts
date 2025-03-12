import { Router } from "express";
import { setUserDetails } from "../controllers/user.controller";

const router = Router();

router.post("/", setUserDetails);

export default router;