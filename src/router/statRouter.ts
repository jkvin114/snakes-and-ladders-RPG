import express, {  Request, Response } from 'express';
import { R } from '../Room/RoomStorage';
import { MarbleGameRecordSchema } from '../mongodb/schemaController/MarbleGameRecord';

import { UserGamePlaySchema } from '../mongodb/schemaController/UserGamePlay';

const router = express.Router()
const{GameRecord,SimulationRecord,SimpleSimulationRecord} = require("../mongodb/GameDBSchema")



interface simulationRecord{
    createdAt:string
    _id:string
    stat:any[]
    count:number
    multiple:boolean
    version:string
    setting:{key:string,value:any}[]
}


router.get('/simulation/summary' ,function (req: Request, res:Response) {
    let count=req.query.count
    let start=req.query.start?Number(req.query.start):0
    console.log(count)
    if(start<0) return res.end()
    
    SimulationRecord.findSummaryByRange(Number(start),Number(count))
    .then((stat:any[]) => {
        if (!stat) return res.status(404).send({ err: 'Statistic not found' });
        else if(stat.length===0) return res.end()
        let result=[]
        for(let s of stat){
            result.push({
                date:s.createdAt,
                id:s._id,
                count:s.count,
                setting:s.setting
            })
        }
        res.end(JSON.stringify(result));
    })
    .catch((err:any) => res.status(500).send(err))
})

router.get('/simulation',function(req: express.Request, res:express.Response){
    let id=req.query.statid
    SimulationRecord.findOneById(id)
    .then((stat:simulationRecord)=>{
        res.end(JSON.stringify(stat));
    })
    .catch((err:any) => res.status(500).send(err))
})

router.get('/simulation/game',function(req: express.Request, res:express.Response){
    let id=req.query.statid
    SimulationRecord.findOneById(id)
    .then((stat:simulationRecord)=>{
        res.end(JSON.stringify(stat));
    })
    .catch((err:any) => res.status(500).send(err))
})

router.get('/game' ,function (req: express.Request, res:express.Response) {
    let count=req.query.count
    let start=req.query.start?Number(req.query.start):0
    if(start<0) return res.end()

    GameRecord.findByRange(Number(start),Number(count))
    .then((stat:any[]) => {
        if (!stat) return res.status(404).send({ err: 'Statistic not found' });
        else if(stat.length===0) return res.end()
        res.end(JSON.stringify({
            stat:stat,
            multiple:true,
            isGamelist:true
        }));
    })
    .catch((err:any) => res.status(500).send(err))
})

router.get('/game/user' ,async function (req: express.Request, res:express.Response) {
    const user = req.query.userId
    const username = req.query.username
    if(!user && !username) 
        return res.status(400).end()
    try{
        let plays = user ? await UserGamePlaySchema.findRPGByUser(String(user))
        :await UserGamePlaySchema.findRPGByUsername(String(username))
        let result=[]
        for(const game of plays){
            const gamedata = await GameRecord.findOneById(game.game)
            if(!gamedata || gamedata.players.length <= game.turn) continue
            let pi = gamedata.players.findIndex((p:any)=>p.turn === game.turn)
            result.push({
                player:gamedata.players[pi],
                map:gamedata.map_data?.name,
                isTeam:gamedata.isTeam,
                totalturn:gamedata.totalturn,
                gameId:game.game,
                isWon:game.isWon,
                turn:game.turn,
                user:game.user,
                username:game.username,
                createdAt:game.createdAt.valueOf()
            })
        }
        return res.json(result).end()
    }
    catch(e){
        console.error(e)
    }
})


router.get('/simulation/simple' ,function (req: express.Request, res:express.Response) {
    let count=req.query.count
    let start=req.query.start?Number(req.query.start):0
    let serverVersion=req.query.version
    if(start<0) return res.end()

    //version don`t matter
    if(!serverVersion){
        SimpleSimulationRecord.findByRange(Number(start),Number(count))
        .then((stat:Object[]) => {
            if (!stat) return res.status(404).send({ err: 'Statistic not found' });
            else if(stat.length===0) return res.end()
            res.end(JSON.stringify(stat));
        })
        .catch((err:any) => res.status(500).send(err))
    }
    else{
        SimpleSimulationRecord.findByRangeAndVersion(Number(start),Number(count),serverVersion)
        .then((stat:Object[]) => {
            if (!stat) return res.status(404).send({ err: 'Statistic not found' });
            else if(stat.length===0) return res.end()
            res.end(JSON.stringify(stat));
        })
        .catch((err:any) => res.status(500).send(err))
    }
    
    
})

router.get("/result", function (req: express.Request, res: express.Response) {
	let rname = req.session.roomname

	if (rname != null && R.hasRoom(rname)) {
		R.getRoom(rname)?.reset()
		R.remove(rname.toString())
	}

	if (req.query.statid == null || req.query.type == null) {
		res.status(404).end({ err: "Statistic not found" })
        return
	}
	if (req.query.type === "game") {
		GameRecord.findById(req.query.statid)
			.then((stat: any) => {
				if (!stat) return res.status(404).send({ err: "Statistic not found" })
				res.end(JSON.stringify(stat))
			})
			.catch((err: any) => res.status(500).send(err))
	} else if (req.query.type === "simulation") {
		console.log(req.query)
		SimulationRecord.findOneById(req.query.statid)
			.then((stat: any) => {
				if (!stat) return res.status(404).send({ err: "Statistic not found" })
				res.end(JSON.stringify(stat))
			})
			.catch((err: any) => res.status(500).send(err))
	} else {
		res.status(404).end("unknown statistic type")
	}
	//let str = JSON.stringify(stat)

	//writeStat(str, isSimulation)

	//res.end()
})


router.get('/marble/all',function(req: express.Request, res:express.Response){
    MarbleGameRecordSchema.findAll()
    .then((stat:any)=>{
        res.json(stat).end();
    })
    .catch((err:any) => res.status(500).send(err))
})
router.get('/marble/user',async function(req: express.Request, res:express.Response){
    const user = req.query.userId
    const username = req.query.username
    if(!user && !username) 
        return res.status(400).end()
    try{

        let plays = user ? await UserGamePlaySchema.findMarbleByUser(String(user))
        :await UserGamePlaySchema.findMarbleByUsername(String(username))

        let result = []
        for(const game of plays){
            const gamedata = await MarbleGameRecordSchema.findById(game.game)
            if(!gamedata) continue
            result.push({
                game:gamedata,
                isWon:game.isWon,
                turn:game.turn,
                user:game.user,
                username:game.username,
                gameId:game.game,
                createdAt:game.createdAt.valueOf()
            })
        }
        return res.json(result).end()
    }
    catch(e){
        console.error(e)
        res.status(500).send(e)
    }
})



router.use("/eval", require("./statEvalRouter"))
module.exports=router

