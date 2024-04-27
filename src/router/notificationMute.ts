
import express = require("express")
import { ControllerWrapper } from "./ControllerWrapper"
const router = express.Router()
import type { Request, Response } from "express"
import type { ISession } from "../session/ISession"
import { loginauth, sessionParser } from "./jwt/auth"
import { NotificationMuteSchema } from "../mongodb/schemaController/NotificationMute"


router.post("/",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: Readonly<ISession>) {
    const result=await NotificationMuteSchema.setByProp(session.userId,req.body.type,req.body.value)
    if(!result) {
        res.status(404).end()
        return
    }
}))

router.get("/",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: Readonly<ISession>) {
    const result =await NotificationMuteSchema.getAll(session.userId)
    if(!result) {
        res.status(404).end()
        return
    }
    res.json(result)
}))

module.exports=router