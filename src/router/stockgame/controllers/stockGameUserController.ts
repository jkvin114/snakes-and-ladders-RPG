import type { Request, Response } from "express"
import { ISession } from "../../../session/ISession"
import { StockGameUserSchema } from "../../../mongodb/schemaController/StockGameUser"
import { UserSchema } from "../../../mongodb/schemaController/User"
export namespace StockGameUserController{
    /**
     * find stockgame user by id. if none, create new user.
     * respond 404 if userid is onvalid.
     * @param req 
     * @param res 
     * @returns 
     */
    export async function findUser(req: Request, res: Response){
        const userId = req.params.userId
		if (!userId) {
			res.status(400).end()
			return
		}
        const user = StockGameUserSchema.findByUserId(userId)
        if(user){
            res.json(user).end()
            return
        }
        const userobj = await UserSchema.findById(userId)
        if(!userobj){
            res.status(404).end()
            return
        }
        const newuser = await StockGameUserSchema.createUser(userId)
        
        res.json(newuser).end()
    }
}