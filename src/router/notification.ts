
import express = require("express")
import { ControllerWrapper } from "./ControllerWrapper"
const router = express.Router()
import type { Request, Response } from "express"
import type { ISession } from "../session/ISession"
import { loginauth, sessionParser } from "./jwt/auth"
import { NotificationSchema } from "../mongodb/schemaController/Notification"
import { NotificationCache } from "../cache/cache"
import { NotificationController } from "../social/notificationController"

/**
 * return all notifications of this user
 */
router.get("/all",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
    const notis = await NotificationSchema.findAll(session.userId)
    NotificationSchema.setAccessed(session.userId)
    res.json(notis)
 }))
 
 /**
  * return new notifications of this user once new notifications are posted
 */
router.get("/poll",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {

    const notis = await NotificationController.poll(session.userId)
    res.json(notis)
 }))
 router.post("/delete",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
     await NotificationSchema.deleteById(req.body.id)
}))

 
 router.post("/test",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
    let message = req.body.message
    NotificationSchema.createTest(message,session.userId)
   await NotificationCache.post(session.userId)
 }))


 module.exports=router