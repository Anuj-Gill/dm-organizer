import {Request, Response} from "express";
import logger from "../../utils/logger.utils";
import { categorizeLinkedInMessages } from "../../services/groq.service";

export async function processMessages(req: Request, res: Response) {
    try{ 
        const {username, messages, priority} = req.body;
        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ error: "Invalid request format. 'messages' must be an array." });
        };
        const categorizedData = await categorizeLinkedInMessages(messages, priority, username);
        console.log(categorizedData);
        console.log("Returning data");
        res.json(categorizedData);

    } catch (e) {
        logger.error(`Error processing messages: ${e}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
}