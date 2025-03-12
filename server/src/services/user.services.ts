import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger.utils";

const prisma = new PrismaClient();

export async function checkAndUpdateUser(username: string, name: string) {
    try{
        const user = await prisma.user.findFirst({
            where: {
                username
            },
        });

        if(!user) {
            return await prisma.user.create({
                data: {
                    username,
                    name
                },
            });
        } else {
            return await prisma.user.update({
                where: {
                    username
                },
                data: {
                    name
                },
            });
        }
    } catch(e) {
        logger.error(`Error in user check and update service: ${e}`);
    }
}