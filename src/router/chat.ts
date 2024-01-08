
import express = require("express")
import { ControllerWrapper } from "./ControllerWrapper"
const router = express.Router()
import type { Request, Response } from "express"
import { ISession } from "../session/inMemorySession"
import { UserCache } from "../cache/cache"
import { loginauth, sessionParser } from "./jwt/auth"
import { ChatRoomSchema } from "../mongodb/schemaController/ChatRoom"
import { ChatRoomJoinStatusSchema } from "../mongodb/schemaController/ChatJoinStatus"
import { ChatRoom } from "../mongodb/ChattingSchema"
import mongoose from "mongoose"
import { UserSchema } from "../mongodb/schemaController/User"
import { ChatMessageQueueSchema } from "../mongodb/schemaController/ChatMessageQueue"
import { ObjectId } from 'bson'


/**
 * return list of rooms (id,name) that the user is in
 */
router.get("/rooms",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
   const rooms = (await ChatRoomJoinStatusSchema.findByUserPopulated(session.userId)).map(r=>r.room)
   res.json(rooms)
}))



/**
 * return list of users (id,name,profileimage,email) that the user is in
 */
router.get("/users/:roomid",sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
    const roomid = req.params.roomid
    const users = (await ChatRoomJoinStatusSchema.findByRoomPopulated(roomid)).map(r=>r.user)
    res.json(users)
 }))
 
/**
 * create a room using a list of usernames. those users will be joined to this room
 * 
 * {users,name}
 */
router.post("/room",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
    let body = req.body
    let users = body.users
    const room = await ChatRoomSchema.create(session.userId,body.name)


    await ChatRoomJoinStatusSchema.join(room._id,session.userId)
    await ChatRoomSchema.onUserJoin(room._id)

    if(users){
        let joined = new Set<string>([session.username])
        for(const name of users){
            //prevent one user joining same room twice
            if(joined.has(name)) continue
            const user = await UserSchema.findIdByUsername(name)

            if(!user) continue
            joined.add(name)
            await ChatRoomJoinStatusSchema.join(room._id,user)
            await ChatRoomSchema.onUserJoin(room._id)
        }
    }
    
    res.json({
        id:room._id,
        name:room.name
    }).end()
}))

/**
 * join to a room using room id
 * 
 * {room}
 */
router.post("/room/join",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
    const roomid = req.body.room
    if(!await ChatRoomSchema.findById(roomid))
    {
        res.status(204).send("invalid room")
        return
    }
    if(await ChatRoomJoinStatusSchema.isUserInRoom(session.userId,roomid)){
        res.status(204).send("already in room")
        return
    }
    await ChatRoomJoinStatusSchema.join(roomid,session.userId)
    await ChatRoomSchema.onUserJoin(roomid)
}))

/**
 * quit room using room id
 * 
 * {room}
 */
router.post("/room/quit",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
    const roomid = req.body.room

    let change = await ChatRoomJoinStatusSchema.left(roomid,session.userId)
    if(change){
        await ChatRoomSchema.onUserLeft(roomid)
        await ChatMessageQueueSchema.onUserLeft(roomid,session.userId)
    }
    else{
        res.status(204).send("invalid room")
    }
}))

module.exports=router