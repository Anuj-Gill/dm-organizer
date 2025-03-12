import { Router } from "express";
import userRouter from "./user.router";
import messageRouter from "./message.router";

const router = Router();

router.use("/user",userRouter);
router.use("/message",messageRouter);

export default router;

