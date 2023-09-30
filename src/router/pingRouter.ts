
import express = require("express")
const router = express.Router()
import mongoose from "mongoose"
import MarbleGameGRPCClient from "../grpc/marblegameclient"

router.get("/",async function(req: express.Request, res: express.Response){
    console.log(mongoose.connection.readyState);
    let time = new Date().valueOf()
    let marbleping = await MarbleGameGRPCClient.Ping()
    let time2 = new Date().valueOf()
    console.log(marbleping)

    if(marbleping!==-1 && marbleping!==-2) marbleping = time2-time

    return res.status(200).json({
        mongodb:mongoose.connection.readyState,
        marblegame:marbleping
    })
 })
 module.exports=router