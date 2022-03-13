import express = require('express');
import { ROOMS } from '../app';
const router = express.Router()
import { Room } from "../room"


/**
 * roomname:string,username:string
 */
router.post('/create',function(req:express.Request,res:express.Response){
    let body = req.body;


    if(body.roomname===""){
        body.roomname="room_"+String(Math.floor(Math.random()*1000000))
    }
    let rname=String(body.roomname)
    console.log(ROOMS.keys())
    if(ROOMS.has(rname)){
        console.log("exidt")
        res.status(400).end("room name exists")
        return
    }
    console.log(rname)
    ROOMS.set(rname,new Room(rname)) 

    if(req.session){
        if(!req.session.username){
            req.session.username=String(body.username)
        }
        
        req.session.roomname=rname
        req.session.turn=0
    }
   // console.log(req.session)
    return res.status(201).end()
})
/**
 * username:string
 */
router.post('/join',async function(req:express.Request,res:express.Response){
    let body = req.body;

    if(req.session){
        if(!req.session.username){
            req.session.username=String(body.username)
        }
        req.session.turn=1
    }
  //  console.log(req.session)
    res.status(200).end()
})

 router.post('/matching',async function(req:express.Request,res:express.Response){

    
    if(req.session){
        console.log("matching")
       // console.log(req.session)
        if(req.session.turn===undefined){
            console.error("unauthorized access to the matching page")
            return res.status(401).end()
        }

        //host
        if(req.session.turn===0){
            return res.status(201).end(req.session.roomname)
        }//guest 
        else if(req.session.turn===1){
            let list=""
            for (let r of ROOMS.values()) {
                if (r.hosting > 0) {
                    list += r.name + "||"
                }
            }//no avaliable rooms
            if(list===""){
                req.session.destroy((e)=>console.error(e))
                return res.status(404).end()
            }


            console.log("getrooms" + list)
            return res.status(200).end(list)
        }
    }
    else{
        console.error("unauthorized access to the matching page")
        return res.status(401).end()
    }

    
})
router.post('/game',async function(req:express.Request,res:express.Response){

    
    if(req.session){
        console.log("game")
       // console.log(req.session)
        if(req.session.turn===undefined){
            console.error("unauthorized access to the game page")
            return res.status(401).end()
        }

        return res.status(200).end()
    }
    else{
        console.error("unauthorized access to the game page")
        return res.status(401).end()
    }

    
})

router.post('/simulation',async function(req:express.Request,res:express.Response){

    
    if(req.session){
        console.log("simulation")
       // console.log(req.session)
        if(!req.session.isLogined){
            console.error("unauthorized access to the simulation page")
            return res.status(401).end()
        }

        return res.status(200).end()
    }
    else{
        console.error("unauthorized access to the simulation page")
        return res.status(401).end()
    }

    
})

module.exports=router