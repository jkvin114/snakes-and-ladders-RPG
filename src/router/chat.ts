
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
import { ChatMessageSchema } from "../mongodb/schemaController/ChatMessage"

const MAX_MESSAGE_FETCH = 20

/**
 * return list of rooms (id,name) that the user is in
 */
router.get("/rooms",loginauth,sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
   const rooms = await ChatRoomJoinStatusSchema.findByUserPopulated(session.userId)
   res.json(rooms)
}))



/**
 * return list of users (id,name,profileimage,email) that the user is in
 */
router.get("/users/:roomid",sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
    const roomid = req.params.roomid
    const users = await ChatRoomJoinStatusSchema.findByRoomPopulated(roomid)
    res.json(users)
 }))
 
 /**
  * fetch messages until serial from (serial - MAX_FETCH_SIZE)
  */
 router.get("/message/:roomid",sessionParser,ControllerWrapper(async function(req: Request, res: Response, session: ISession) {
    const roomid = req.params.roomid
    const room = await ChatRoomSchema.findById(roomid)
    if(!room){
        res.status(404).send("invalid room")
        return   
    }
    if(!req.query.serial){
        const messages = await ChatMessageSchema.findAllFromSerial(roomid,room.serial - MAX_MESSAGE_FETCH)
        res.json(messages)
        return
    }
    
    let serial =  Number(req.query.serial)
    if( isNaN(serial)){
        res.status(400).send("invalid serial number")
        return   
    }
    const messages = await ChatMessageSchema.findAllBetweenSerial(roomid,serial - MAX_MESSAGE_FETCH ,serial)
    res.json(messages)
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
        res.status(404).send("invalid room")
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
    delete session.currentChatRoom
    
    let change = await ChatRoomJoinStatusSchema.left(roomid,session.userId)
    if(change){
        await ChatRoomSchema.onUserLeft(roomid)
    }
    else{
        res.status(404).send("invalid room")
    }
}))

module.exports=router