import {Request, Response} from "express";
import logger from "../../utils/logger.utils";
import { categorizeLinkedInMessages } from "../../services/groq.service";

export async function processMessages(req: Request, res: Response) {
    try{ 
        const {username, messages, priority, apiConfig} = req.body;
        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ error: "Invalid request format. 'messages' must be an array." });
        }
        
        const result = await categorizeLinkedInMessages(messages, priority, username, apiConfig);
        
        if (result.error) {
            logger.error(`API Error: ${result.error.status} - ${result.error.message}`);
            res.status(result.error.status).json({ error: result.error.message });
        } else {
            logger.info(`Returning data ${result}`);
            res.json(result);
        }
        
        
    } catch (e) {
        logger.error(`Error processing messages: ${e}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
}