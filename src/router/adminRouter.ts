
import express = require("express")
import { R } from "../Room/RoomStorage"
const router = express.Router()
import { adminauth } from "./board/helpers"
import mongoose from "mongoose"
import MarbleGameGRPCClient from "../grpc/marblegameclient"
import { SessionManager } from "../session/inMemorySession"

router.get("/allusers",adminauth, async function (req: express.Request, res: express.Response) {
    try{
        let sessions = SessionManager.getAll()
        let users = SessionManager.getAllUsers()

        return res.status(200).json({sessions:sessions,users:users})
    }
    catch(e){
        return res.status(500).end("server error")
    }
})

router.get("/allrooms",adminauth,function(req: express.Request, res: express.Response){
   let rooms= [...R.allRPG(),...R.allMarble()].map((room)=>room.roomStatus)

   return res.status(200).json(rooms)

})

router.post("/reset_room/:roomname",adminauth, function (req: express.Request, res: express.Response) {
    console.log(req.params.roomname)
    if(R.hasRoom(req.params.roomname)) R.getRoom(req.params.roomname).reset()
    else return res.status(404).end("room does not exist")

	return res.status(200).end("admin approved")
})
module.exports = router
