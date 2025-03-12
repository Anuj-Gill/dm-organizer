import { Request, Response } from "express";
import logger from "../../utils/logger.utils";
import { checkAndUpdateUser } from "../../services/user.services";

export async function setUserDetails(req: Request, res: Response) {
    try{
        const {username, name} = req.body;
        const user = await checkAndUpdateUser(username, name);
        if(user) {
            logger.info("User info updated!")
            res.status(200).json({success: true, data: user});
        };

    } catch(e) {
        logger.error(`Error updating user details: ${e}`);
    }
}