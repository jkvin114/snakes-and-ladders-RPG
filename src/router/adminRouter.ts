
import express = require("express")
import { R } from "../Room/RoomStorage"
const router = express.Router()
import { adminauth } from "./board/helpers"

router.get("/allusers",adminauth, async function (req: express.Request, res: express.Response) {
    try{
        let users:any[]=await new Promise((resolve,rej)=>{
            let list=[]
            req.sessionStore.all((e,obj)=>{
                if(obj instanceof Array){
                    list=obj
                }
                else{
                    list=Object.values(obj)
                }
                resolve(list)
            })
        })

        return res.status(200).json({data:users})
    }
    catch(e){
        return res.status(500).end("server error")
    }
    return res.status(500).end("server error")
    // return res.status(200).json({users:users})
})

router.get("/allrooms",adminauth,function(req: express.Request, res: express.Response){
   let rooms= [...R.allRPG(),...R.allMarble()].map((room)=>room.roomStatus)

   return res.status(200).json({data:rooms})

})

router.post("/reset_room/:roomname",adminauth, function (req: express.Request, res: express.Response) {
    console.log(req.params.roomname)
    if(R.hasRoom(req.params.roomname)) R.getRoom(req.params.roomname).reset()
    else return res.status(404).end("room does not exist")

	return res.status(200).end("admin approved")
})

module.exports = router
